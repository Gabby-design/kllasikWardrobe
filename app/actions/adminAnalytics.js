'use server';

import { checkAdminSession } from './adminAuth.js';
import { getAnalyticsMetrics } from '../../src/lib/analytics.js';

export async function getLiveAnalyticsAction() {
  const isAuthorized = await checkAdminSession();
  if (!isAuthorized) {
    return {
      success: false,
      error: 'Unauthorized: active admin session required',
    };
  }

  try {
    const data = await getAnalyticsMetrics();
    return {
      success: true,
      data,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Failed to fetch analytics from Redis',
    };
  }
}
