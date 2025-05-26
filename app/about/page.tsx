import Link from "next/link"
import { Clock, Users, BarChart3, Mail, ArrowLeft } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Client Time Tracker
            </h1>
            <Link href="/auth">
              <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        {/* Hero Section */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <CardTitle className="text-4xl font-bold text-gray-900">About Client Time Tracker</CardTitle>
            <CardDescription className="text-lg text-gray-600 max-w-2xl mx-auto">
              A simple, efficient solution for tracking time spent on client projects and tasks.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">Time Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                Accurately track time spent on different client projects with easy start/stop functionality.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">Client Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                Organize your work by clients and projects for better time allocation and billing.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">Reporting</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                Generate detailed reports to analyze productivity and create accurate client invoices.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Purpose Section */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900">What is this app for?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Client Time Tracker is designed for freelancers, consultants, and small businesses who need to accurately
              track time spent on client work. Whether you're billing by the hour or simply want to understand how you
              spend your time, this app provides the tools you need.
            </p>
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900">Perfect for:</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Freelancers tracking billable hours</li>
                <li>Consultants managing multiple client projects</li>
                <li>Small teams collaborating on client work</li>
                <li>Anyone who wants to improve time management</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Contact Section */}
        <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-2xl">Have suggestions or feedback?</CardTitle>
            <CardDescription className="text-blue-100">
              We'd love to hear from you! Send us your ideas for improvements.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <a
              href="mailto:ideas@luminolsystems.com"
              className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              <Mail className="w-4 h-4 mr-2" />
              ideas@luminolsystems.com
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
