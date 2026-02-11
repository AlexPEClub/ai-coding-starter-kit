'use client'

import React, { useState, useMemo } from 'react'
import { Search, ExternalLink, Database, Zap, Filter, Globe } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ApiEntry {
  name: string
  url: string
  description: string
}

interface Category {
  id: string
  name: string
  count: number
  apis: ApiEntry[]
}

// Mock data - in production, this would come from a real API
const mockCatalog: Record<string, Category> = {
  social_media: {
    id: "social_media",
    name: "Social Media",
    count: 3,
    apis: [
      {
        name: "Twitter API",
        url: "https://api.twitter.com",
        description: "Access tweets, user profiles, and trending topics from Twitter's platform."
      },
      {
        name: "LinkedIn API",
        url: "https://api.linkedin.com",
        description: "Professional networking data including profiles, jobs, and company information."
      },
      {
        name: "Instagram Basic Display",
        url: "https://api.instagram.com",
        description: "User media, profile information, and basic Instagram data access."
      }
    ]
  },
  ecommerce: {
    id: "ecommerce",
    name: "E-Commerce",
    count: 2,
    apis: [
      {
        name: "Amazon Product API",
        url: "https://webservices.amazon.com",
        description: "Product information, pricing, and availability data from Amazon marketplace."
      },
      {
        name: "Shopify Storefront API",
        url: "https://shopify.dev/docs/storefront-api",
        description: "Access product catalogs, collections, and checkout data from Shopify stores."
      }
    ]
  },
  news: {
    id: "news",
    name: "News & Content",
    count: 3,
    apis: [
      {
        name: "NewsAPI.org",
        url: "https://newsapi.org",
        description: "Real-time news articles from thousands of sources worldwide."
      },
      {
        name: "Reddit API",
        url: "https://reddit.com/dev/api",
        description: "Posts, comments, and community data from Reddit's platform."
      },
      {
        name: "Medium API",
        url: "https://github.com/Medium/medium-api-docs",
        description: "Articles, publications, and author information from Medium."
      }
    ]
  }
}

export const ScrapingRegistry: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('social_media')
  const [searchQuery, setSearchQuery] = useState('')

  const categories = useMemo(() => Object.values(mockCatalog), [])
  const currentCategory = mockCatalog[selectedCategory]

  const filteredApis = useMemo(() => {
    const apis = currentCategory?.apis || []
    if (!searchQuery) return apis
    return apis.filter(api =>
      api.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      api.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [selectedCategory, searchQuery, currentCategory])

  return (
    <div className="flex flex-col h-[600px]">
      {/* Header/Search */}
      <div className="p-4 border-b space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Search scraping registry..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground uppercase">
            <Database size={12} />
            Registry Status: <Badge variant="secondary" className="text-xs">SYNCHRONIZED</Badge>
          </div>
          <Button variant="outline" size="sm">
            <Filter size={14} className="mr-2" />
            Filter
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Categories */}
        <div className="w-1/3 border-r overflow-y-auto bg-muted/20">
          <div className="p-2">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.name ? "default" : "ghost"}
                className="w-full justify-between mb-1 h-auto p-3"
                onClick={() => setSelectedCategory(cat.name)}
              >
                <span className="text-sm">{cat.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {cat.count}
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {filteredApis.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Globe size={48} className="mb-4 opacity-50" />
                <p className="text-sm">No scrapers match your query</p>
                <p className="text-xs mt-1">Try adjusting your search terms</p>
              </div>
            ) : (
              filteredApis.map((api, idx) => (
                <Card key={idx} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-base">{api.name}</CardTitle>
                        <CardDescription className="text-sm mt-1">
                          {api.description}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(api.url, '_blank')}
                      >
                        <ExternalLink size={14} />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2">
                      <Button size="sm" className="text-xs">
                        <Zap size={10} className="mr-1" />
                        INTEGRATE
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs">
                        DETAILS
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Footer info */}
      <div className="p-3 border-t bg-muted/30">
        <div className="flex items-center justify-between text-xs">
          <div className="font-mono text-muted-foreground">
            LOADED: {currentCategory?.name} // TOTAL_ENTRIES: {currentCategory?.count || 0}
          </div>
          <div className="flex items-center gap-1 text-green-600">
            <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-mono">UPLINK_ACTIVE</span>
          </div>
        </div>
      </div>
    </div>
  )
}