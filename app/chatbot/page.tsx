"use client"

import { AdminSidebar } from "@/components/admin-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bot, MessageCircle, Settings, BarChart3, Plus } from "lucide-react"

export default function ChatBotPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 p-6 space-y-6 overflow-auto">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Partner Chat Bot</h1>
            <p className="text-gray-600">Manage AI-powered chat bot for partner communication</p>
          </div>
          <Button className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600">
            <Plus className="w-4 h-4 mr-2" />
            Create Flow
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Bot className="w-8 h-8 text-purple-600" />
                <Badge variant="secondary">Active</Badge>
              </div>
              <CardTitle className="text-2xl font-bold text-purple-900">24/7</CardTitle>
              <CardDescription className="text-purple-700">Bot Availability</CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <MessageCircle className="w-8 h-8 text-blue-600" />
                <Badge variant="secondary">1,245</Badge>
              </div>
              <CardTitle className="text-2xl font-bold text-blue-900">1,245</CardTitle>
              <CardDescription className="text-blue-700">Messages Today</CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <BarChart3 className="w-8 h-8 text-green-600" />
                <Badge variant="secondary">87%</Badge>
              </div>
              <CardTitle className="text-2xl font-bold text-green-900">87%</CardTitle>
              <CardDescription className="text-green-700">Resolution Rate</CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Settings className="w-8 h-8 text-orange-600" />
                <Badge variant="secondary">12</Badge>
              </div>
              <CardTitle className="text-2xl font-bold text-orange-900">12</CardTitle>
              <CardDescription className="text-orange-700">Active Flows</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="flows" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="flows">Chat Flows</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="training">Training</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="flows" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Chat Bot Flows</CardTitle>
                <CardDescription>Manage automated conversation flows for partners</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <Bot className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Chat Bot Management</h3>
                  <p className="mb-4">Configure automated responses and conversation flows for partner support</p>
                  <Button>Get Started</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Bot Analytics</CardTitle>
                <CardDescription>Track chat bot performance and user interactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Analytics dashboard coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="training" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Bot Training</CardTitle>
                <CardDescription>Train the bot with new responses and improve accuracy</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <Settings className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Training interface coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Bot Settings</CardTitle>
                <CardDescription>Configure bot behavior and integration settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <Settings className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Settings panel coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
