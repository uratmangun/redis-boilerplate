import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Search, Plus, ArrowLeft, Bot, User } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

interface SearchItem {
  id: string
  title: string
  content: string
  category: string
  relevanceScore: number
}

interface AISearchPageProps {
  onBack: () => void
}

export function AISearchPage({ onBack }: AISearchPageProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchItem[]>([
    {
      id: '1',
      title: 'Redis Vector Search Documentation',
      content: 'Learn how to implement semantic search using Redis Vector Search with AI embeddings...',
      category: 'Documentation',
      relevanceScore: 0.95
    },
    {
      id: '2',
      title: 'Building Chat Applications with Redis',
      content: 'A comprehensive guide to creating real-time chat applications using Redis Pub/Sub...',
      category: 'Tutorial',
      relevanceScore: 0.87
    },
    {
      id: '3',
      title: 'AI-Powered Search Best Practices',
      content: 'Optimize your semantic search implementation with these proven techniques...',
      category: 'Best Practices',
      relevanceScore: 0.82
    }
  ])
  const [newItemTitle, setNewItemTitle] = useState('')
  const [newItemContent, setNewItemContent] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    
    try {
      // Call the real Redis backend API
      const response = await fetch(`/functions/search-items?query=${encodeURIComponent(searchQuery)}&limit=50`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        setSearchResults(result.items || []);
      } else {
        console.error('Search failed:', result.message);
        // Fallback to mock results if Redis search fails
        const mockResults: SearchItem[] = [
          {
            id: Date.now().toString(),
            title: `Search Result for "${searchQuery}"`,
            content: `No results found in Redis for "${searchQuery}". This is a fallback result.`,
            category: 'Fallback',
            relevanceScore: 0.5
          }
        ];
        setSearchResults(mockResults);
      }
    } catch (error) {
      console.error('Error searching Redis:', error);
      // Fallback to mock results on error
      const mockResults: SearchItem[] = [
        {
          id: Date.now().toString(),
          title: `Search Result for "${searchQuery}"`,
          content: `Redis search unavailable. Showing fallback result for "${searchQuery}".`,
          category: 'Fallback',
          relevanceScore: 0.5
        }
      ];
      setSearchResults(mockResults);
    } finally {
      setIsSearching(false);
    }
  }

  const handleAddItem = async () => {
    if (!newItemTitle.trim() || !newItemContent.trim()) {
      alert('Please fill in both title and content');
      return;
    }

    try {
      // Call the real Redis backend API
      const response = await fetch('/functions/add-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newItemTitle,
          content: newItemContent,
          category: 'User Added',
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Add the new item to the results for immediate feedback
        const newItem: SearchItem = {
          id: result.item?.id || Date.now().toString(),
          title: newItemTitle,
          content: newItemContent,
          category: 'User Added',
          relevanceScore: 1.0
        };
        
        setSearchResults([newItem, ...searchResults]);
        setNewItemTitle('');
        setNewItemContent('');
        alert(`Item added successfully to Redis! ID: ${result.item?.id}`);
      } else {
        alert(`Failed to add item: ${result.message}`);
      }
    } catch (error) {
      console.error('Error adding item to Redis:', error);
      alert('Failed to add item. Please check your connection and Redis configuration.');
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Documentation': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'Tutorial': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'Best Practices': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'AI Generated': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'User Added': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <ThemeToggle />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-purple-600" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              AI Semantic Search
            </h1>
          </div>
        </div>

        {/* Add Item Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Item
            </CardTitle>
            <CardDescription>
              Add content to the searchable knowledge base
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Item title..."
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
            />
            <Input
              placeholder="Item content..."
              value={newItemContent}
              onChange={(e) => setNewItemContent(e.target.value)}
            />
            <Button onClick={handleAddItem} className="w-full">
              Add Item
            </Button>
          </CardContent>
        </Card>

        {/* Search Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Semantic Search
            </CardTitle>
            <CardDescription>
              Search using natural language queries powered by AI embeddings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Ask anything... e.g., 'How to implement real-time chat?'"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Table */}
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              {searchResults.length} items found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Relevance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searchResults.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell className="max-w-md truncate">{item.content}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                        {item.category}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full" 
                            style={{ width: `${item.relevanceScore * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {Math.round(item.relevanceScore * 100)}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
