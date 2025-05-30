"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { LoginForm } from "@/components/login-form"
import { RegisterForm } from "@/components/register-form"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const { user, isLoading } = useAuth()
  const router = useRouter()

  // Redirect to main app if already logged in
  useEffect(() => {
    if (user && !isLoading) {
      router.push("/")
    }
  }, [user, isLoading, router])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render the form if user is authenticated (will redirect)
  if (user) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <h1 className="mb-8 text-center text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Client Time Tracker
        </h1>

        {isLogin ? <LoginForm /> : <RegisterForm />}

        <div className="mt-4 text-center">
          <Button variant="link" onClick={() => setIsLogin(!isLogin)} className="text-blue-600 hover:text-blue-800">
            {isLogin ? "Need an account? Register" : "Already have an account? Login"}
          </Button>
        </div>
      </div>
    </div>
  )
}
