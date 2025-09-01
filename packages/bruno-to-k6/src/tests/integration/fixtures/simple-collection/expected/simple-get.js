import http from 'k6/http'
import { sleep, check } from 'k6'

export default function () {
  // GET https://example.test
  const res = http.request('GET', 'https://example.test')
  check(res, { "status < 400": r => r.status < 400 })

  sleep(1)
}
