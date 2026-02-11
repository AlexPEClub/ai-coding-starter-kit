'use client'

import * as React from 'react'
import { useState, useRef, useEffect } from 'react'
import { Send, Bot, Loader2, User, Sparkles } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Message {
  role: 'user' | 'model'
  text: string
}

interface AdminAssistantProps {
  user?: {
    email?: string
    name?: string
  }
}

export const AdminAssistant: React.FC<AdminAssistantProps> = ({ user }) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatSession = useRef<any>(null)

  useEffect(() => {
    const greeting = `Hello ${user?.name || user?.email || 'Admin'}. I am your AI Admin Assistant. How can I assist you with management tasks today?`

    setMessages([{ role: 'model', text: greeting }])
  }, [user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    const initChat = async () => {
      try {
        // Mock initialization - in production, this would connect to Gemini API
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
        if (!apiKey) {
          console.warn("API Key missing - using mock mode");
          return;
        }
        // Initialize chat session here
      } catch (error) {
        console.error("AI Init failed", error);
      }
    };
    initChat();
  }, [user]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsThinking(true);

    try {
      // Simulate AI response - in production, this would call Gemini API
      setTimeout(() => {
        const mockResponse = generateMockResponse(userMsg);
        setMessages(prev => [...prev, { role: 'model', text: mockResponse }]);
        setIsThinking(false);
      }, 1000 + Math.random() * 2000);
    } catch {
      setMessages(prev => [...prev, { role: 'model', text: 'System Error. Agent disconnected.' }]);
      setIsThinking(false);
    }
  };

  const generateMockResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('help') || input.includes('assist')) {
      return `I can help you with:\n\n🔧 System administration tasks\n📊 Performance monitoring\n🔍 Security audits\n🚀 Deployment management\n📝 Documentation generation\n\nTry commands like: "/status", "/audit", "/deploy"`;
    }
    
    if (input.includes('status')) {
      return `🟢 System Status Report:\n\n• Database: Operational\n• API Services: Running\n• Cache: Healthy\n• Active Users: 1\n• Uptime: 99.9%\n\nAll systems are performing optimally.`;
    }
    
    if (input.includes('audit') || input.includes('security')) {
      return `🔒 Security Audit Summary:\n\n✅ Authentication: Secure\n✅ Data Encryption: Active\n✅ API Rate Limiting: Configured\n⚠️ SSL Certificate: Expires in 30 days\n✅ Backup Systems: Operational\n\nRecommendation: Update SSL certificate soon.`;
    }
    
    if (input.includes('deploy')) {
      return `🚀 Deployment Options:\n\n• Staging: Ready for testing\n• Production: Requires approval\n• Rollback: Available from last 5 deployments\n\nCurrent branch: main\nLast deployment: 2 days ago\nDeployment status: Success`;
    }
    
    return `I understand you want to "${userInput}". Let me help you with that. This is a mock response - in production, I would use Gemini AI to provide intelligent assistance for your administrative tasks.`;
  };

  return (
    <div className="flex flex-col h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
            <Sparkles className="text-primary" size={16} />
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI COMMAND CENTER</h3>
            <p className="text-xs text-muted-foreground uppercase">GEMINI PRO 2.0 // ACTIVE</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-green-600 font-mono">ONLINE</span>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'model' && (
                <div className="w-6 h-6 rounded-md bg-muted border flex items-center justify-center mr-2 shrink-0 mt-1">
                  <Bot size={12} className="text-primary" />
                </div>
              )}
              <div className={`max-w-[85%] rounded-md p-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'bg-muted text-muted-foreground'
                }`}>
                {msg.text.split('\n').map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
              {msg.role === 'user' && (
                <div className="w-6 h-6 rounded-md bg-muted border flex items-center justify-center ml-2 shrink-0 mt-1">
                  <User size={12} className="text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
          {isThinking && (
            <div className="flex justify-start">
              <div className="w-6 h-6 rounded-md bg-muted border flex items-center justify-center mr-2 shrink-0">
                <Bot size={12} className="text-primary" />
              </div>
              <div className="bg-muted rounded-md p-3 flex items-center">
                <Loader2 size={14} className="text-primary animate-spin" />
                <span className="text-xs text-muted-foreground ml-2">Processing Request...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t bg-muted/30">
        <div className="relative flex items-center">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Command AI..."
            className="pr-12"
            disabled={isThinking}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!input.trim() || isThinking}
            className="absolute right-2"
          >
            <Send size={16} />
          </Button>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          Try: /status, /audit, /deploy, or ask for help
        </div>
      </form>
    </div>
  )
}