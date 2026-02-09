// app/privacy/page.tsx
"use client";

import {
  Shield,
  Lock,
  FileText,
  User,
  Cookie,
  Database,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Page Header */}
      <div className="text-center mb-12">
        <Shield className="w-12 h-12 mx-auto text-primary mb-4" />
        <h1 className="text-4xl font-bold">Privacy Policy</h1>
        <p className="text-muted-foreground mt-2">
          <strong>Effective Date:</strong> January 1, 2025
        </p>
      </div>

      {/* Intro */}
      <p className="text-lg text-center max-w-2xl mx-auto mb-12">
        In <strong>this site</strong>, your privacy matters. This page explains
        how we collect, use and safeguard your data while you use our site,
        nuggets and dashboard.
      </p>

      {/* Sections */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Information We Collect
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>You provide:</strong> Name, email, account login and any
                content you submit.
              </li>
              <li>
                <strong>Automatically:</strong> Pages visited, clicks,
                device/browser info, cookies/local storage.
              </li>
              <li>
                <strong>Third parties:</strong> Basic data from analytics or
                authentication providers.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              How We Use Your Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2">
              <li>Provide and secure the site & dashboard.</li>
              <li>Enable publishing & editing of nuggets.</li>
              <li>Respond to inquiries and provide support.</li>
              <li>Analyze traffic & improve services (with consent).</li>
              <li>Meet legal obligations.</li>
            </ul>
            <p className="mt-2 text-sm italic">
              We never sell your personal data.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cookie className="w-5 h-5 text-primary" />
              Cookies & Local Storage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              We use cookies/local storage for essential site functions, theme
              preferences and analytics (if enabled). You can manage cookies in
              your browser settings.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Data Sharing & Retention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>We may share data with:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                Service providers (hosting, analytics) under confidentiality
                agreements.
              </li>
              <li>Legal authorities if required by law.</li>
            </ul>
            <p className="mt-4">
              We keep personal data only as long as needed for services or law,
              then delete or anonymize it.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Your Rights & Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2">
              Depending on your location (Kenya DPA, GDPR, CCPA), you may:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Access, correct or delete your data.</li>
              <li>Withdraw consent anytime.</li>
              <li>Restrict or object to processing.</li>
              <li>File a complaint with your local authority.</li>
            </ul>
            <p className="mt-4">
              We use HTTPS, hashed passwords, role-based access and restricted
              database permissions. While no system is 100% secure, we take
              strong precautions.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Children, Updates & Contact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Our services are not directed at children under 13 and we do not
              knowingly collect their data.
            </p>
            <p className="mt-3">
              We may update this policy. Updates will be posted here with a new{" "}
              <em>Effective Date</em>.
            </p>
            <p className="mt-3">
              Questions? Email us at <strong>dennis.cmunene@gmail.com</strong>{" "}
              or write to <strong>Dennis Chomba</strong>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}