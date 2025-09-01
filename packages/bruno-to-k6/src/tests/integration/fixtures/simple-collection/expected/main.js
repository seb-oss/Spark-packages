import http from 'k6/http'
import { sleep, check } from 'k6'

export default function () {
  // GET https://example.test
  const res = http.request('GET', 'https://example.test')
  check(res, { "status < 400": r => r.status < 400 })

  // POST https://example.test/items
  const res2 = http.request('POST', 'https://example.test/items', "{ \"name\": \"Widget\" }", { headers: {"Content-Type":"application/json"} })
  check(res2, { "status < 400": r => r.status < 400 })

  // PUT https://example.test/items/123
  const res3 = http.request('PUT', 'https://example.test/items/123', "{ \"name\": \"Widget v2\" }", { headers: {"Content-Type":"application/json"} })
  check(res3, { "status < 400": r => r.status < 400 })

  // DELETE https://example.test/items/123
  const res4 = http.request('DELETE', 'https://example.test/items/123')
  check(res4, { "status < 400": r => r.status < 400 })

  sleep(1)
}
