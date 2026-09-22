import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Container } from "@/components/layout/container"
import { PageWrapper } from "@/components/layout/page-wrapper"

export default function DesignSystemPage() {
  return (
    <PageWrapper>
      <Container className="space-y-12">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-primary-700">Design System</h1>
          <p className="text-lg text-slate-600">
            A temporary preview page showcasing the foundational UI elements for the DMart Self Checkout system.
          </p>
        </div>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold border-b pb-2">Typography</h2>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold">Heading 1 (Display)</h1>
            <h2 className="text-3xl font-semibold">Heading 2</h2>
            <h3 className="text-2xl font-medium">Heading 3</h3>
            <p className="text-base text-slate-700">
              Body text: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
            <p className="text-sm text-slate-500">Small text / caption description</p>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold border-b pb-2">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold border-b pb-2">Badges</h2>
          <div className="flex flex-wrap gap-4">
            <Badge variant="default">Default</Badge>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold border-b pb-2">Form Controls</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email Address</label>
              <Input type="email" placeholder="Enter your email..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <Input type="password" placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Disabled Input</label>
              <Input disabled placeholder="Cannot type here" />
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold border-b pb-2">Cards</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Product Name</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">This is a description of a product in the DMart inventory.</p>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">₹ 199.00</span>
                  <Button variant="outline" size="sm">Add to Cart</Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-primary-500 shadow-md">
              <CardHeader>
                <CardTitle className="text-primary-700">Active Order</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">You have pending items in your cart ready for checkout.</p>
                <Button className="w-full">Proceed to Pay</Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </Container>
    </PageWrapper>
  )
}
