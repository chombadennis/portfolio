// app/terms/page.tsx
"use client";

import {
  FileText,
  ShieldCheck,
  User,
  Lock,
  Copy,
  Eye,
  AlertTriangle,
  Ban,
  RefreshCcw,
  Phone,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function Terms() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Page Header */}
      <div className="text-center mb-12">
        <FileText className="w-12 h-12 mx-auto text-primary mb-4" />
        <h1 className="text-4xl font-bold">Terms of Service</h1>
        <p className="text-muted-foreground mt-2">
          <strong>Effective Date:</strong> January 1, 2025
        </p>
      </div>

      {/* Intro */}
      <p className="text-lg text-center max-w-2xl mx-auto mb-12">
        Welcome to <strong>this site</strong>. By accessing or using our
        website, nuggets or dashboard (the “Services”), you agree to these
        Terms. If you do not agree, please discontinue use.
      </p>

      {/* Sections */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              1. Use of Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2">
              <li>Use the Site only for personal or informational purposes.</li>
              <li>
                Do not misuse the Services, interfere with their operation, or
                attempt unauthorized access.
              </li>
              <li>
                Submitted content must not infringe on others’ rights or be
                unlawful/harmful.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              2. Accounts (Dashboard)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2">
              <li>
                You are responsible for keeping your login details secure.
              </li>
              <li>
                You are fully accountable for all activity under your account.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Copy className="w-5 h-5 text-primary" />
              3. Content Ownership
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              All original content here belongs to <strong>this site</strong>{" "}
              unless otherwise noted. You retain ownership of your submitted
              content but grant us a limited license to host, display and use it
              for operation of the Services.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              4. Privacy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Your use of the Services is also subject to our{" "}
              <a href="/privacy" className="text-primary underline">
                Privacy Policy
              </a>
              .
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              5. Disclaimer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              The Services are provided “as is” without warranties of any kind.
              We do not guarantee uninterrupted, error-free or secure access.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-primary" />
              6. Limitation of Liability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              To the fullest extent permitted by law, we are not liable for any
              damages resulting from your use of the Services, including lost
              data or interruptions.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ban className="w-5 h-5 text-primary" />
              7. Termination
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              We may suspend or terminate your access at any time if you violate
              these Terms or misuse the Services.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCcw className="w-5 h-5 text-primary" />
              8. Changes to Terms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              We may update these Terms periodically. Continued use of the
              Services after changes means you accept the updated Terms.
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary" />
              9. Contact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Questions about these Terms? Contact us at{" "}
              <strong>dennis.cmunene@gmail.com</strong>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}