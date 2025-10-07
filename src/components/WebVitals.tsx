"use client";

import { useEffect } from 'react';
import { getCLS, getFID, getFCP, getLCP, getTTFB, Metric } from 'web-vitals';

interface WebVitalsTrackerProps {
  enabled?: boolean;
}

export function WebVitalsTracker({ enabled = process.env.NODE_ENV === 'production' }: WebVitalsTrackerProps) {
  useEffect(() => {
    if (!enabled) return;

    const sendToAnalytics = (metric: Metric) => {
      // In a real application, you would send this to your analytics service
      // For example: Google Analytics, DataDog, Sentry, etc.
      console.log('Web Vitals:', {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
      });

      // Example: Send to Google Analytics 4
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', metric.name, {
          value: Math.round(metric.value),
          event_category: 'Web Vitals',
          event_label: metric.rating,
          non_interaction: true,
        });
      }

      // Example: Send to a custom analytics endpoint
      // fetch('/api/analytics/web-vitals', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(metric),
      // }).catch(console.error);
    };

    // Track all Core Web Vitals
    getCLS(sendToAnalytics);
    getFID(sendToAnalytics);
    getFCP(sendToAnalytics);
    getLCP(sendToAnalytics);
    getTTFB(sendToAnalytics);
  }, [enabled]);

  return null; // This component doesn't render anything
}

// Hook version for functional components
export function useWebVitals() {
  useEffect(() => {
    const logMetric = (metric: Metric) => {
      console.log(`Web Vitals [${metric.name}]:`, {
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
      });
    };

    getCLS(logMetric);
    getFID(logMetric);
    getFCP(logMetric);
    getLCP(logMetric);
    getTTFB(logMetric);
  }, []);
}
