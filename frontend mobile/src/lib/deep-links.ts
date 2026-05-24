import { AppRoute } from "@/lib/app-navigation";

export interface ResolvedDeepLink {
  route: AppRoute;
  params?: Record<string, unknown>;
}

const CREDIT_SCHEMES = ["creditn:", "creaditn:", "credittn:"];

const parseQuery = (query = "") => {
  const params: Record<string, string> = {};
  const search = query.startsWith("?") ? query.slice(1) : query;

  search.split("&").forEach((pair) => {
    if (!pair) return;
    const [key, value = ""] = pair.split("=");
    if (!key) return;
    params[decodeURIComponent(key)] = decodeURIComponent(value.replace(/\+/g, " "));
  });

  return params;
};

const asNumber = (value?: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const resolveFromParts = (segments: string[], params: Record<string, string>): ResolvedDeepLink | null => {
  const [resource, actionOrId] = segments;
  const articleId = asNumber(params.articleId ?? params.productId ?? params.id ?? actionOrId);
  const merchantId = asNumber(params.shop ?? params.shopId ?? params.merchantId);
  const merchantName = params.shopName ?? params.merchantName ?? params.boutiqueName ?? params.name ?? "";
  const productName = params.productName ?? params.articleName ?? params.name ?? "";

  if (resource === "kyc") {
    return { route: "Kyc" };
  }

  if (resource === "score" || resource === "creadi-score") {
    return { route: "CreadiScore" };
  }

  if (resource === "payment" || resource === "pay") {
    return { route: "Installments" };
  }

  if (resource === "download" || resource === "open" || resource === "home") {
    return { route: "Home" };
  }

  if (resource === "product" || resource === "article" || articleId) {
    if (articleId) {
      return {
        route: "ProductDetail",
        params: {
          articleId,
          merchantId: merchantId ?? 0,
          merchantName,
          articleName: productName || "Article",
          fromDeepLink: true,
        },
      };
    }

    if (merchantName || productName) {
      return {
        route: "ShopProducts",
        params: {
          merchantId: merchantId ?? 0,
          merchantName,
          highlightedProductName: productName,
          fromDeepLink: true,
        },
      };
    }
  }

  if (resource === "shop" || resource === "boutique" || resource === "store") {
    return {
      route: "ShopProducts",
      params: {
        merchantId: merchantId ?? 0,
        merchantName,
        fromDeepLink: true,
      },
    };
  }

  return null;
};

const resolveObjectPayload = (payload: Record<string, unknown>): ResolvedDeepLink | null => {
  const link = payload.deepLink ?? payload.url ?? payload.link;
  if (typeof link === "string") {
    return resolveDeepLink(link);
  }

  const params: Record<string, string> = {};
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params[key] = String(value);
    }
  });

  const resource = String(payload.type ?? payload.resource ?? (params.articleId ? "product" : "shop")).toLowerCase();
  return resolveFromParts([resource], params);
};

export function resolveDeepLink(rawValue: string): ResolvedDeepLink | null {
  const value = rawValue.trim();
  if (!value) return null;

  try {
    const parsedJson = JSON.parse(value);
    if (parsedJson && typeof parsedJson === "object" && !Array.isArray(parsedJson)) {
      return resolveObjectPayload(parsedJson as Record<string, unknown>);
    }
  } catch {
    // Not JSON. Continue with URL/text parsing.
  }

  try {
    const url = new URL(value);
    const params = parseQuery(url.search);

    if (CREDIT_SCHEMES.includes(url.protocol)) {
      const host = url.hostname ? [url.hostname] : [];
      const path = url.pathname.split("/").filter(Boolean);
      return resolveFromParts([...host, ...path], params);
    }

    if (url.protocol === "http:" || url.protocol === "https:") {
      const path = url.pathname.split("/").filter(Boolean);
      const resource = params.articleId || params.productId ? "product" : path[0] ?? "";
      return resolveFromParts([resource, ...path.slice(1)], params) ?? (url.hostname.includes("creaditn") ? { route: "Home" } : null);
    }
  } catch {
    // Continue with bare value parsing.
  }

  const [pathPart, queryPart] = value.split("?");
  const segments = pathPart.split("/").filter(Boolean);
  return resolveFromParts(segments, parseQuery(queryPart));
}
