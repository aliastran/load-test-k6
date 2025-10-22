import http from 'k6/http';
import { sleep } from 'k6';
import { Counter } from 'k6/metrics';

// Custom metric đếm lỗi
export let errors = new Counter('errors');

// Config stages: ramp nhanh lên 1000 VU
export let options = {
  stages: [
    { duration: '30s', target: 200 },   // nhanh lên 200 VU
    { duration: '30s', target: 500 },   // nhanh lên 500 VU
    { duration: '30s', target: 1000 },  // nhanh lên 1000 VU
    { duration: '10m', target: 1000 },   // giữ 1000 VU trong 2 phút
    { duration: '1m', target: 0 },      // giảm về 0
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],   // fail nếu >5% request fail
    errors: ['count<1000000'],        // chỉ để theo dõi
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
