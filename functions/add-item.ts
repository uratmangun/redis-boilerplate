// Deno function to add items to Redis database
import { connect } from "https://deno.land/x/redis@v0.32.3/mod.ts";

interface AddItemRequest {
  title: string;
  content: string;
  category?: string;
}

interface AddItemResponse {
  success: boolean;
  message: string;
  itemId?: string;
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

    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({
        success: false,
        message: 'Method not allowed. Use POST to add items.',
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
      // Parse request body
      const body: AddItemRequest = await request.json();
      
      // Validate required fields
      if (!body.title || !body.content) {
        return new Response(JSON.stringify({
          success: false,
          message: 'Title and content are required fields.',
          timestamp: new Date().toISOString(),
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }

      // Get Redis connection URL from environment
      const redisUrl = Deno.env.get('REDIS_URL');
      if (!redisUrl) {
        return new Response(JSON.stringify({
          success: false,
          message: 'Redis connection not configured. Please set REDIS_URL environment variable.',
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

      // Generate unique item ID
      const itemId = `item:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
      
      // Create item object
      const item = {
        id: itemId,
        title: body.title,
        content: body.content,
        category: body.category || 'General',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Store item in Redis as a hash
      await redis.hset(itemId, item);
      
      // Add item ID to a set for easy retrieval of all items
      await redis.sadd('items:all', itemId);
      
      // Add item to category-specific set
      await redis.sadd(`items:category:${item.category}`, itemId);
      
      // For search functionality, store searchable text
      const searchableText = `${item.title} ${item.content}`.toLowerCase();
      await redis.set(`search:${itemId}`, searchableText);

      // Close Redis connection
      redis.close();

      const response: AddItemResponse = {
        success: true,
        message: 'Item added successfully to Redis database.',
        itemId: itemId,
        timestamp: new Date().toISOString(),
      };

      return new Response(JSON.stringify(response), {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });

    } catch (error) {
      console.error('Error adding item to Redis:', error);
      
      return new Response(JSON.stringify({
        success: false,
        message: 'Failed to add item to Redis database.',
        error: error.message,
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
