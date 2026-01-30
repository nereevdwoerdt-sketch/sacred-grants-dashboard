import './globals.css'

export const metadata = {
  title: 'Sacred Foundation - Grants Dashboard',
  description: 'Track and manage grant applications for Sacred Foundation',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-earth-50">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  )
}
