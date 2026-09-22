import os

routes = {
    'CUSTOMER': [
        'dashboard', 'products', 'scan', 'cart', 'checkout', 
        'receipt', 'history', 'loyalty', 'profile', 'exit-qr'
    ],
    'SECURITY': [
        'security/dashboard', 'security/scan', 'security/history', 'security/alerts'
    ],
    'ADMIN': [
        'admin/dashboard', 'admin/products', 'admin/inventory', 'admin/orders', 
        'admin/customers', 'admin/coupons', 'admin/loyalty', 'admin/security', 
        'admin/analytics', 'admin/fraud'
    ]
}

template = """\"use client\";
import {{ ProtectedRoute }} from "@/components/auth/ProtectedRoute";
import {{ PageWrapper }} from "@/components/layout/page-wrapper";
import {{ Container }} from "@/components/layout/container";

export default function Page() {{
  return (
    <ProtectedRoute allowedRoles={{["{role}"]}}>
      <PageWrapper>
        <Container>
          <div className="rounded-xl border bg-white p-8 shadow-sm text-center">
            <h1 className="text-2xl font-bold">/{path}</h1>
            <p className="text-slate-500 mt-2">Placeholder for {role} route.</p>
          </div>
        </Container>
      </PageWrapper>
    </ProtectedRoute>
  );
}}
"""

for role, paths in routes.items():
    for path in paths:
        dir_path = f'src/app/{path}'
        os.makedirs(dir_path, exist_ok=True)
        with open(f'{dir_path}/page.tsx', 'w', encoding='utf-8') as f:
            f.write(template.format(role=role, path=path))

print("Routes generated successfully.")
