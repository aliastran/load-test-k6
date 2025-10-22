import http from 'k6/http';
import { sleep } from 'k6';
import { Counter } from 'k6/metrics';

// Custom metric đếm lỗi
export let errors = new Counter('errors');

// Config stages: ramp nhanh lên 1000 VU
export let options = {
  stages: [
    { duration: '1m', target: 500 },    // ramp lên 500 VU
    { duration: '1m', target: 1000 },   // ramp lên 1000 VU
    { duration: '1m', target: 2500 },   // ramp lên 2500 VU
    { duration: '1m', target: 5000 },   // ramp lên 5000 VU
    { duration: '5m', target: 5000 },  // giữ 5000 VU
    { duration: '2m', target: 0 },      // ramp-down
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
    errors: ['count<5000000'],
  },
};

// Target URL
const TARGET_URL = __ENV.TARGET || 'https://colascore.com';
const SLEEP_SEC = __ENV.SLEEP_SEC ? parseFloat(__ENV.SLEEP_SEC) : 0.5; // sleep ngắn

// Test function
export default function () {
  const params = {
    headers: {
      'User-Agent': 'k6-burst-test/1.0',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    },
    tags: { static: 'yes' }
  };

  const res = http.get(TARGET_URL, params);

  // Đếm lỗi (không phải 2xx/3xx)
  if (res.status < 200 || res.status >= 400) {
    errors.add(1);
  }

  sleep(SLEEP_SEC);
}
