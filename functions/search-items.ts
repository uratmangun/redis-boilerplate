// Deno function to search items in Redis database
import { connect } from "https://deno.land/x/redis@v0.32.3/mod.ts";

interface SearchRequest {
  query?: string;
  category?: string;
  limit?: number;
}

interface SearchItem {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  relevanceScore: number;
}

interface SearchResponse {
  success: boolean;
  message: string;
  items: SearchItem[];
  totalCount: number;
  timestamp: string;
}

export default {
  async fetch(request: Request): Promise<Response> {
    // Handle CORS for development
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Allow both GET and POST requests
    if (request.method !== 'GET' && request.method !== 'POST') {
      return new Response(JSON.stringify({
        success: false,
        message: 'Method not allowed. Use GET or POST to search items.',
        items: [],
        totalCount: 0,
        timestamp: new Date().toISOString(),
      }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    try {
      // Parse search parameters
      let searchParams: SearchRequest = {};
      
      if (request.method === 'POST') {
        searchParams = await request.json();
      } else {
        const url = new URL(request.url);
        searchParams = {
          query: url.searchParams.get('query') || undefined,
          category: url.searchParams.get('category') || undefined,
          limit: parseInt(url.searchParams.get('limit') || '50'),
        };
      }

      // Get Redis connection URL from environment
      const redisUrl = Deno.env.get('REDIS_URL');
      if (!redisUrl) {
        return new Response(JSON.stringify({
          success: false,
          message: 'Redis connection not configured. Please set REDIS_URL environment variable.',
          items: [],
          totalCount: 0,
          timestamp: new Date().toISOString(),
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }

      // Connect to Redis
      const redis = await connect({
        hostname: new URL(redisUrl).hostname,
        port: parseInt(new URL(redisUrl).port) || 6379,
        password: new URL(redisUrl).password || undefined,
      });

      let itemIds: string[] = [];

      // Get item IDs based on search criteria
      if (searchParams.category) {
        // Search by category
        itemIds = await redis.smembers(`items:category:${searchParams.category}`);
      } else {
        // Get all items
        itemIds = await redis.smembers('items:all');
      }

      // Retrieve item details
      const items: SearchItem[] = [];
      
      for (const itemId of itemIds) {
        const itemData = await redis.hgetall(itemId);
        
        if (itemData && Object.keys(itemData).length > 0) {
          let relevanceScore = 1.0;
          
          // Calculate relevance score if query is provided
          if (searchParams.query) {
            const searchableText = await redis.get(`search:${itemId}`);
            if (searchableText) {
              const queryLower = searchParams.query.toLowerCase();
              const textLower = searchableText.toLowerCase();
              
              // Simple relevance scoring
              if (textLower.includes(queryLower)) {
                const titleMatch = itemData.title?.toLowerCase().includes(queryLower);
                const exactMatch = textLower === queryLower;
                
                if (exactMatch) relevanceScore = 1.0;
                else if (titleMatch) relevanceScore = 0.9;
                else relevanceScore = 0.7;
              } else {
                // Skip items that don't match the query
                continue;
              }
            }
          }

          const item: SearchItem = {
            id: itemData.id || itemId,
            title: itemData.title || '',
            content: itemData.content || '',
            category: itemData.category || 'General',
            createdAt: itemData.createdAt || new Date().toISOString(),
            updatedAt: itemData.updatedAt || new Date().toISOString(),
            relevanceScore,
          };

          items.push(item);
        }
      }

      // Sort by relevance score (highest first)
      items.sort((a, b) => b.relevanceScore - a.relevanceScore);

      // Apply limit
      const limit = searchParams.limit || 50;
      const limitedItems = items.slice(0, limit);

      // Close Redis connection
      redis.close();

      const response: SearchResponse = {
        success: true,
        message: `Found ${limitedItems.length} items${searchParams.query ? ` matching "${searchParams.query}"` : ''}.`,
        items: limitedItems,
        totalCount: limitedItems.length,
        timestamp: new Date().toISOString(),
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });

    } catch (error) {
      console.error('Error searching items in Redis:', error);
      
      return new Response(JSON.stringify({
        success: false,
        message: 'Failed to search items in Redis database.',
        error: error.message,
        items: [],
        totalCount: 0,
        timestamp: new Date().toISOString(),
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }
  },
};
