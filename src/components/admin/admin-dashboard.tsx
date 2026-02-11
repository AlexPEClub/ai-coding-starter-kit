'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bot, Activity, Users, Database, Zap, ExternalLink, Search, Send, Loader2, User, Sparkles } from 'lucide-react'
import { AdminAssistant } from './admin-assistant'
import { ScrapingRegistry } from './scraping-registry'

interface AdminDashboardProps {
  user?: {
    email?: string
    name?: string
  }
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.name || user?.email || 'Admin'}</p>
          </div>
          <Button variant="outline">
            Sign Out
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1</div>
              <p className="text-xs text-muted-foreground">Current online users</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-lg font-semibold">Operational</span>
              </div>
              <p className="text-xs text-muted-foreground">All systems running</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Calls</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="assistant" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="assistant" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              AI Assistant
            </TabsTrigger>
            <TabsTrigger value="scraping" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Scraping Registry
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="assistant" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  AI Command Center
                </CardTitle>
                <CardDescription>
                  Powered by Gemini Pro 2.0 - Your administrative co-pilot
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <AdminAssistant />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="scraping" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Scraping Resource Registry
                </CardTitle>
                <CardDescription>
                  Browse and manage web scraping resources and integrations
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrapingRegistry />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}