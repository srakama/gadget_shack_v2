const scraperConfig = {
  target_url: "https://www.techmarkit.co.za",
  crawl_type: "dynamic",
  pagination: {
    enabled: true,
    selector: ".pagination a.next",
    max_pages: 10
  },
  data_extraction: {
    items: [
      {
        type: "product",
        selector: ".product-item",
        attributes: [
          {
            name: "sku",
            selector: ".product-sku",
            type: "text"
          },
          {
            name: "name",
            selector: ".product-title",
            type: "text"
          },
          {
            name: "price",
            selector: ".product-price",
            type: "number",
            transformation: {
              operation: "multiply",
              value: 1.2
            }
          },
          {
            name: "description",
            selector: ".product-description",
            type: "text"
          },
          {
            name: "images",
            selector: ".product-image img",
            type: "attribute",
            attribute_name: "src"
          },
          {
            name: "sizes",
            selector: ".product-sizes",
            type: "text"
          },
          {
            name: "colors",
            selector: ".product-colors",
            type: "text"
          },
          {
            name: "category",
            selector: ".product-category",
            type: "text"
          }
        ]
      }
    ],
    output_format: "json",
    output_file: "techmarkit_products.json"
  },
  request_config: {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    },
    delay: 2000,
    max_retries: 3
  }
};

module.exports = scraperConfig;
