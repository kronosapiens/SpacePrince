# DNS

DNS settings for `spaceprince.xyz`, hosted in AWS Route 53.

## Records

| Name | Type | Value | Consumer |
|---|---|---|---|
| `spaceprince.xyz` | A | `216.198.79.1` | Vercel |
| `spaceprince.xyz` | MX | `10 mx1.improvmx.com`<br>`20 mx2.improvmx.com` | ImprovMX |
| `spaceprince.xyz` | NS | `ns-1147.awsdns-15.org.`<br>`ns-884.awsdns-46.net.`<br>`ns-1594.awsdns-07.co.uk.`<br>`ns-118.awsdns-14.com.` | Namecheap |
| `spaceprince.xyz` | SOA | `ns-1147.awsdns-15.org. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400` | Route53 |
| `spaceprince.xyz` | TXT | `"v=spf1 include:spf.improvmx.com ~all"` | ImprovMX |
| `_dmarc.spaceprince.xyz` | TXT | `"v=DMARC1; p=none; rua=mailto:kronovet@gmail.com;"` | ConvertKit |
| `cka._domainkey.spaceprince.xyz` | CNAME | `dkim.dm-48108d04.sg6.convertkit.com` | ConvertKit |
| `cka2._domainkey.spaceprince.xyz` | CNAME | `dkim2.dm-35f038a7.sg6.convertkit.com` | ConvertKit |
| `ckespa.spaceprince.xyz` | CNAME | `spf.dm-cc227dc0.sg6.convertkit.com` | ConvertKit |
