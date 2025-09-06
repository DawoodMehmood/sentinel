"use client";

import axios from "axios";
import React from "react";
import OfferList from "./OfferList";
import type { Price } from "@/types/price";
import { useRouter } from "next/navigation";

const PricingBox = ({ product }: { product: Price }) => {
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
const handleSubscription = async (e: React.MouseEvent<HTMLButtonElement>) => {
  e.preventDefault();
  if (!product?.planId) return;

  try {
    setLoading(true);

    // 1) Check current billing status
    const statusRes = await fetch("/api/billing/status", { cache: "no-store" });
    if (statusRes.status === 401) {
      router.push("/signin");
      return;
    }
    if (statusRes.ok) {
      const { status } = await statusRes.json() as { status: "none" | "active" | "expired" };
      // If already active, don't send them to checkout again
      if (status === "active") {
        router.push("/dashboard/billing");
        return;
      }
      // If expired or none, proceed to checkout below
    }
    // If status call failed for some reason, we’ll fall back to trying checkout.

    // 2) Create checkout session
    const { data } = await axios.post(
      "/api/payment",
      { planId: product.planId, origin: "site" },
      { headers: { "Content-Type": "application/json" } }
    );

    if (data?.url) {
      window.location.assign(data.url);
      return;
    }

    alert("Could not start checkout. Please try again.");
  } catch (err: any) {
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      router.push("/signin");
      return;
    }
    console.error("checkout error", err);
    alert("Failed to start checkout. Please try again.");
  } finally {
    setLoading(false);
  }
};


  const dollars = (product.unit_amount / 100).toLocaleString("en-US");

  return (
    <div className="w-full px-4 md:w-1/2 lg:w-1/3">
      <div
        className="relative z-10 mb-10 overflow-hidden rounded-xl bg-white px-8 py-10 shadow-[0px_0px_40px_0px_rgba(0,0,0,0.08)] dark:bg-dark-2 sm:p-12 lg:px-6 lg:py-10 xl:p-14"
        data-wow-delay=".1s"
      >
        {product.nickname?.toLowerCase() === "pro" && (
          <p className="absolute right-[-50px] top-[60px] inline-block -rotate-90 rounded-bl-md rounded-tl-md bg-primary px-5 py-2 text-base font-medium text-white">
            Recommended
          </p>
        )}

        <span className="mb-5 block text-xl font-medium text-dark dark:text-white">
          {product.nickname}
        </span>

        <h2 className="mb-11 text-4xl font-semibold text-dark dark:text-white xl:text-[42px] xl:leading-[1.21]">
          <span className="text-xl font-medium">$ </span>
          <span className="-ml-1 -tracking-[2px]">{dollars}</span>
          <span className="text-base font-normal text-body-color dark:text-dark-6">
            {" "}
            / month
          </span>
        </h2>

        <div className="mb-[50px]">
          <h3 className="mb-5 text-lg font-medium text-dark dark:text-white">
            Features
          </h3>
          <div className="mb-10">
            {product?.offers?.map((offer, i) => (
              <OfferList key={i} text={offer} />
            ))}
          </div>
        </div>

        <div className="w-full">
          <button
            onClick={handleSubscription}
            disabled={loading}
            className="inline-block rounded-md bg-primary border border-transparent px-7 py-3 text-center text-base font-medium text-white transition duration-300 hover:bg-dark-2 hover:border-white disabled:opacity-60"
          >
            {loading ? "Redirecting…" : "Purchase Now"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PricingBox;
