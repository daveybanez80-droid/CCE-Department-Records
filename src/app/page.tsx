"use client";

import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <main id="main">
      <header className="shell flex items-center justify-between py-6">
        <div className="flex items-center gap-4">
          <Image
            src="/assets/logo-b.png"
            alt="Andres Soriano Colleges of Bislig"
            width={48}
            height={48}
            className="h-10 w-auto"
          />
          <Image
            src="/assets/logo-a.png"
            alt="College of Computer Education"
            width={48}
            height={48}
            className="h-10 w-auto"
          />
        </div>
        <Link href="/login" className="btn-primary">
          System Login
        </Link>
      </header>
      <hr className="rule-institutional" />

      <section className="shell py-20 lg:py-28">
        <div className="max-w-prose">
          <span className="label-eyebrow mb-3">College of Computer Education</span>
          <h1 className="font-display text-display text-ink mb-8">
            Departmental Information Management.
          </h1>
          <p className="text-lead text-ink/75 mb-10">
            A centralized platform for managing student records and department inventory.
            Built for accuracy, efficiency, and clarity in daily operations.
          </p>
          <div className="flex gap-4">
            <Link href="/login" className="btn-crimson h-12 px-8 text-body">
              Get Started
            </Link>
          </div>
        </div>
      </section>

      <section className="shell py-16 bg-navy-soft">
        <h2 className="label-eyebrow text-center mb-12">Core Functions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Student Lifecycle",
              desc: "Manage regular, irregular, transferee, graduating, and graduated student records.",
            },
            {
              title: "Bulk Operations",
              desc: "Import records instantly via Excel for high-volume data handling.",
            },
            {
              title: "Inventory Asset",
              desc: "Track department equipment with detailed audit and attachment history.",
            },
          ].map((feat) => (
            <div
              key={feat.title}
              className="bg-white p-8 rounded-lg shadow-lift border border-rule"
            >
              <h3 className="font-display text-h3 text-navy mb-4">{feat.title}</h3>
              <p className="text-small text-ink/75">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="shell py-20">
        <h2 className="label-eyebrow text-center mb-12">Institutional Hierarchy</h2>
        <div className="max-w-4xl mx-auto border border-rule p-4 rounded-md">
          <Image
            src="/assets/logo-c.png"
            alt="Organizational Chart"
            width={800}
            height={600}
            className="w-full h-auto"
          />
        </div>
      </section>
    </main>
  );
}