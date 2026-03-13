import type { Metadata } from "next"
import { H1, H2, H3 } from "~/components/common/heading"
import { Link } from "~/components/common/link"
import { Container } from "~/components/web/ui/container"
import { IntroDescription } from "~/components/web/ui/intro"

export const metadata: Metadata = {
  title: "Rating Methodology - ColdEmailKit",
  description: "Learn how ColdEmailKit calculates trust scores and ratings for cold email tools.",
}

export default function MethodologyPage() {
  return (
    <Container className="max-w-3xl py-12 md:py-16">
      <div className="flex flex-col gap-8">
        <div>
          <H1>Our Rating Methodology</H1>
          <IntroDescription className="mt-4">
            At ColdEmailKit, we believe in radical transparency. Here&apos;s a detailed breakdown of
            exactly how we calculate the ratings and trust scores you see across our platform.
          </IntroDescription>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <H2>Data Sources</H2>
          <p>
            To provide the most robust and trustworthy score possible, we aggregate review and rating
            data from five primary platforms:
          </p>
          <ul>
            <li><strong>ColdEmailKit:</strong> Ratings from our own verified community of cold email practitioners.</li>
            <li><strong>G2:</strong> Broad software reviews from authenticated users.</li>
            <li><strong>Trustpilot:</strong> Customer experience focused platform reviews.</li>
            <li><strong>Capterra:</strong> Verified software and service reviews.</li>
            <li><strong>TrustRadius:</strong> In-depth B2B technology reviews.</li>
          </ul>

          <H2>The 40/60 Weighting System</H2>
          <p>
            Not all review platforms are created equal. Different platforms cater to different audiences
            and have different verification standards. To calculate the <strong>Overall Rating</strong> (out of 5 stars), 
            we use a weighted average approach:
          </p>
          <ul>
            <li><strong>40% Weight - ColdEmailKit Community:</strong> Because our audience consists specifically of cold email experts and outbound sales professionals, we prioritize ratings submitted directly on ColdEmailKit.</li>
            <li><strong>60% Weight - External Platforms:</strong> The remaining 60% is split equally among the external platforms (G2, Trustpilot, Capterra, TrustRadius) that possess valid review data for the tool. This ensures broader market sentiment is captured without diluting expert insights.</li>
          </ul>
          <p>
            <em>Note: If a tool only has reviews on ColdEmailKit or only on external platforms, the active sources share 100% of the weight proportionally.</em>
          </p>

          <H2>The Trust Score</H2>
          <p>
            The <strong>Trust Score (0-100%)</strong> is a unique metric designed by ColdEmailKit to help you
            identify both the <em>quality</em> of the tool and the <em>reliability</em> of that quality.
          </p>
          <p>
            A tool with a 5.0 rating from 2 reviews is statistically less reliable than a tool with a 4.8 rating from 5,000 reviews.
            The Trust Score accounts for this by factoring in a <strong>Confidence Score</strong>.
          </p>
          
          <H3>Calculation Details</H3>
          <ol>
            <li><strong>Confidence Factor:</strong> We calculate total reviews across all 5 platforms. Confidence reaches 100% when a tool aggregates 50 or more total reviews. Below 50 reviews, confidence scales linearly.</li>
            <li><strong>Trust Result:</strong> We convert the 5-star Overall Rating to a 0-100 scale, and multiply it by the Confidence score.</li>
          </ol>
          <div className="bg-muted p-4 rounded-md my-4 font-mono text-sm border">
            Trust Score = (Overall Rating / 5) x MIN(Total Reviews / 50, 1.0) x 100
          </div>
          <p>
            This means new tools with very few reviews will naturally have a lower Trust Score until they build up sufficient, verified community feedback across platforms to validate their high ratings.
          </p>

          <H2>Update Frequency</H2>
          <p>
            We run automated data collection workflows periodically (typically every 7 days) to refresh external review counts, update our AI summaries, and recalculate ratings so that our Trust Scores remain accurate and up-to-date with current market sentiment.
          </p>
          
          <H2>Commitment to Transparency</H2>
          <p>
            We never accept payment to inflate a tool&apos;s Trust Score or artificially boost its Overall Rating. We use the exact same algorithm to calculate scores for every tool listed on ColdEmailKit.
          </p>
          
          <p className="mt-8">
            <Link href="/" className="text-primary hover:underline">
              &larr; Back to Tools
            </Link>
          </p>
        </div>
      </div>
    </Container>
  )
}
