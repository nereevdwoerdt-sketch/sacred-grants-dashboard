import './globals.css'

export const metadata = {
  title: 'Sacred Foundation - Grants Dashboard',
  description: 'Track and manage grant applications for Sacred Foundation',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-earth-50">
        {children}
      </body>
    </html>
  )
}
