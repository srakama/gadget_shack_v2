# Monitoring Checklist

Basic checks
- [ ] Uptime probe to storefront (200 OK) and backend /health (200 OK)
- [ ] Alert on 5xx rate above threshold in backend logs
- [ ] Check /api/admin/refresh/status daily (admin JWT)

Metrics (starter)
- [ ] Request rate and latency (p95) for backend
- [ ] Error rate by route
- [ ] DB write failures and locks
- [ ] Daily refresh duration, completion status, total_products parsed

Logging
- [ ] Centralize logs (e.g., journald → promtail → Loki; or Cloud logs)
- [ ] Include request IDs and user IDs in logs for admin routes

Incident response
- [ ] On-call runbook: restart backend, tail logs, check /status page
- [ ] Rollback plan for storefront and backend
- [ ] Backups verify/restore procedure for DB_PATH

Synthetic tests
- [ ] Schedule: register/login, products list, add-to-cart or create order
- [ ] Alert if any step fails

