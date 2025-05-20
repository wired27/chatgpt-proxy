export const config = { runtime: "edge" };

export default async function handler(req) {
  const {
    nextUrl: { pathname },
    method,
    headers,
    body,
  } = req;
  headers.delete("host");
  headers.delete("referer");

  // Handle preflight OPTIONS request
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods":
          "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // Improved path extraction
  const pathSegments = pathname.split("/proxy-sse");
  let path = "";

  // If there's something after /proxy-sse
  if (pathSegments.length > 1) {
    path = pathSegments[1] || "";
  }

  console.log("Original pathname:", pathname);
  console.log("Extracted path:", path);

  const url = `https://api.openai.com${path}`;
  console.log("Forwarding to:", url);

  const options = {
    headers: headers,
    method: method,
    body: body,
    redirect: "follow",
  };
  const modifiedRequest = new Request(url, options);
  try {
    const response = await fetch(modifiedRequest);
    const modifiedResponse = new Response(response.body, response);

    // Add all CORS headers to the response
    modifiedResponse.headers.set("Access-Control-Allow-Origin", "*");
    modifiedResponse.headers.set(
      "Access-Control-Allow-Methods",
      "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS"
    );
    modifiedResponse.headers.set("Access-Control-Allow-Headers", "*");
    modifiedResponse.headers.set("Access-Control-Allow-Credentials", "true");

    return modifiedResponse;
  } catch (e) {
    console.log("catch: ", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods":
          "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Credentials": "true",
      },
    });
  }
}
