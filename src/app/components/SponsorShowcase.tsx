"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";

interface Company {
  id: string;
  name: string;
  logoUrl?: string | null;
}

interface SponsorGroup {
  tier: string;
  companies: Company[];
}

const HARDCODED_SPONSORS: SponsorGroup[] = [
  {
    "tier": "Title Sponsor",
    "companies": [
      {
        "id": "cmk5ez7430000ju1edwz5vjrt",
        "name": "Phoenix Logistics India Pvt Ltd",
        "logoUrl": "https://elasticbeanstalk-ap-south-1-762703128013.s3.ap-south-1.amazonaws.com/admin/1767874909163-29zq7atbv6j-PHENOIX.png"
      }
    ]
  },
  {
    "tier": "T Shirts",
    "companies": [
      {
        "id": "cmjh03qwp0000la1eaz44qqvr",
        "name": "Conturk Shipping Logistik Hizmetleri Ltd Sti",
        "logoUrl": "https://elasticbeanstalk-ap-south-1-762703128013.s3.ap-south-1.amazonaws.com/admin/1767341593880-otc5udeirg-download.png"
      }
    ]
  },
  {
    "tier": "Bags",
    "companies": [
      {
        "id": "cmjh03qwp0000la1eaz44qqvr",
        "name": "Conturk Shipping Logistik Hizmetleri Ltd Sti",
        "logoUrl": "https://elasticbeanstalk-ap-south-1-762703128013.s3.ap-south-1.amazonaws.com/admin/1767341593880-otc5udeirg-download.png"
      }
    ]
  },
  {
    "tier": "Folder & Pen",
    "companies": [
      {
        "id": "cmk5ez7430000ju1edwz5vjrt",
        "name": "Phoenix Logistics India Pvt Ltd",
        "logoUrl": "https://elasticbeanstalk-ap-south-1-762703128013.s3.ap-south-1.amazonaws.com/admin/1767874909163-29zq7atbv6j-PHENOIX.png"
      }
    ]
  }
];

export default function SponsorShowcase() {
  const sponsorsByTier = HARDCODED_SPONSORS;

  const titleSponsor = sponsorsByTier.find((s) =>
    s.tier.toLowerCase().includes("title")
  );
  const otherSponsors = sponsorsByTier.filter(
    (s) => !s.tier.toLowerCase().includes("title")
  );

  return (
    <section
      className="relative overflow-hidden py-12"
      style={{ background: "#ffffff" }}
    >
      {/* Subtle background orbs */}
      <div
        className="pointer-events-none absolute"
        style={{
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "rgba(0,74,173,0.05)",
          filter: "blur(90px)",
          top: -150,
          left: -120,
        }}
      />
      <div
        className="pointer-events-none absolute"
        style={{
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "rgba(46,187,121,0.06)",
          filter: "blur(90px)",
          bottom: -100,
          right: -80,
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl px-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-4 flex items-center justify-center gap-3"
          >
            <span
              style={{
                width: 32,
                height: 1,
                background: "#2ebb79",
                display: "inline-block",
              }}
            />
            <span
              style={{
                fontSize: 11,
                letterSpacing: "0.25em",
                fontWeight: 500,
                color: "#2ebb79",
                textTransform: "uppercase",
                fontFamily: "DM Sans, sans-serif",
              }}
            >
              Presented by our partners
            </span>
            <span
              style={{
                width: 32,
                height: 1,
                background: "#2ebb79",
                display: "inline-block",
              }}
            />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(2.2rem, 5vw, 3.4rem)",
              fontWeight: 900,
              color: "#0a0e1a",
              lineHeight: 1.1,
              letterSpacing: "-0.01em",
              margin: 0,
            }}
          >
            Our Proud{" "}
            <span style={{ color: "#004aad" }}>Sponsors</span>
          </motion.h2>
        </div>

        {/* Title Sponsor */}
        {titleSponsor && (
          <div className="mb-12 flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-8 flex items-center gap-3"
            >
              <span style={{ color: "#b8892a", fontSize: 14 }}>★</span>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "linear-gradient(135deg, #b8892a, #e8c86a)",
                  color: "#1a1000",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  padding: "6px 18px",
                  borderRadius: 100,
                  fontFamily: "DM Sans, sans-serif",
                }}
              >
                ✦ Title Sponsor
              </div>
              <span style={{ color: "#b8892a", fontSize: 14 }}>★</span>
            </motion.div>

            <div className="flex flex-wrap justify-center gap-8">
              {titleSponsor.companies.map((company, idx) => (
                <motion.div
                  key={`title-${company.id}`}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -6 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  style={{ width: 420, maxWidth: "100%" }}
                >
                  <div
                    style={{
                      position: "relative",
                      background: "#ffffff",
                      border: "1.5px solid rgba(184,137,42,0.35)",
                      borderRadius: 24,
                      padding: "32px 24px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: 160,
                      overflow: "hidden",
                      boxShadow:
                        "0 8px 40px rgba(184,137,42,0.1), 0 2px 12px rgba(0,0,0,0.06)",
                    }}
                  >
                    {/* Top-left gold corner accent */}
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: 80,
                        height: 80,
                        background:
                          "linear-gradient(135deg, rgba(184,137,42,0.12) 0%, transparent 60%)",
                        borderRadius: "24px 0 0 0",
                        pointerEvents: "none",
                      }}
                    />
                    {/* Glow orb top-right */}
                    <div
                      style={{
                        position: "absolute",
                        width: 160,
                        height: 160,
                        background:
                          "radial-gradient(circle, rgba(184,137,42,0.08) 0%, transparent 70%)",
                        top: -40,
                        right: -40,
                        borderRadius: "50%",
                        pointerEvents: "none",
                      }}
                    />
                    {/* Badge */}
                    <div
                      style={{
                        position: "absolute",
                        top: 14,
                        right: 14,
                        background: "linear-gradient(135deg, #b8892a, #e8c86a)",
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                      }}
                    >
                      ⚡
                    </div>

                    {/* Logo or name */}
                    {company.logoUrl ? (
                      <Image
                        src={company.logoUrl}
                        alt={company.name}
                        width={280}
                        height={120}
                        className="relative z-10 max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span
                        style={{
                          fontFamily: "'Playfair Display', Georgia, serif",
                          fontSize: "2rem",
                          fontWeight: 900,
                          color: "rgba(10,14,26,0.12)",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          position: "relative",
                          zIndex: 1,
                        }}
                      >
                        {company.name}
                      </span>
                    )}

                    <p
                      style={{
                        marginTop: 16,
                        fontSize: 11,
                        fontWeight: 500,
                        color: "rgba(184,137,42,0.8)",
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        fontFamily: "DM Sans, sans-serif",
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      {company.name}
                    </p>

                    {/* Bottom gold stripe */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 3,
                        background:
                          "linear-gradient(90deg, transparent, #b8892a 30%, #e8c86a 60%, transparent)",
                        borderRadius: "0 0 24px 24px",
                      }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}



        {/* Other Sponsors */}
        {otherSponsors.length > 0 && (
          <div className="flex flex-wrap justify-center gap-4">
            {otherSponsors
              .flatMap((group) =>
                group.companies.map((company) => ({
                  ...company,
                  tier: group.tier,
                }))
              )
              .map((item, idx) => (
                <motion.div
                  key={`other-${item.id}-${item.tier}`}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08 }}
                  whileHover={{
                    y: -4,
                    boxShadow: "0 12px 32px rgba(0,74,173,0.1)",
                  }}
                  style={{
                    position: "relative",
                    background: "#ffffff",
                    border: "1px solid rgba(0,0,0,0.08)",
                    borderRadius: 16,
                    padding: "20px 20px 16px",
                    width: 220,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    cursor: "default",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                    transition: "box-shadow 0.3s, border-color 0.3s, transform 0.3s",
                  }}
                >
                  {/* Tier badge */}
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: "#2ebb79",
                      background: "rgba(46,187,121,0.1)",
                      padding: "4px 10px",
                      borderRadius: 100,
                      marginBottom: 16,
                      fontFamily: "DM Sans, sans-serif",
                    }}
                  >
                    {item.tier}
                  </div>

                  {/* Logo area */}
                  <div
                    style={{
                      height: 64,
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {item.logoUrl ? (
                      <Image
                        src={item.logoUrl}
                        alt={item.name}
                        width={140}
                        height={64}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span
                        style={{
                          fontFamily: "'Playfair Display', Georgia, serif",
                          fontSize: "1.05rem",
                          fontWeight: 700,
                          color: "rgba(10,14,26,0.15)",
                          letterSpacing: "0.02em",
                          textAlign: "center",
                          wordBreak: "break-word",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {item.name}
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <p
                    style={{
                      marginTop: 10,
                      fontSize: 10,
                      fontWeight: 500,
                      color: "rgba(10,14,26,0.35)",
                      letterSpacing: "0.05em",
                      textAlign: "center",
                      fontFamily: "DM Sans, sans-serif",
                      wordBreak: "break-word",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {item.name}
                  </p>
                </motion.div>
              ))}
          </div>
        )}
      </div>
    </section>
  );
}