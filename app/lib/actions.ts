"use server";

import { revalidatePath } from "next/cache";
import { buildApiUrl } from "./api";

export async function triggerNewsRefresh(formData: FormData) {
  const query = formData.get("query")?.toString() || "ai";
  
  try {
    const endpointUrl = buildApiUrl('/news/refresh');

    const res = await fetch(endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, source_slug: null }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to trigger refresh");
    }

    const data = await res.json();
    revalidatePath("/");
    return { success: true, message: data.message };
  } catch (error: any) {
    console.error("Error refreshing news:", error);
    return { success: false, message: error.message || "An error occurred." };
  }
}

export async function triggerSourceNewsRefresh(sourceSlug: string) {
  try {
    const endpointUrl = buildApiUrl('/news/refresh');

    const res = await fetch(endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: "dummy", source_slug: sourceSlug }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to trigger refresh");
    }

    const data = await res.json();
    revalidatePath("/sources");
    return { success: true, message: data.message };
  } catch (error: any) {
    console.error("Error refreshing source news:", error);
    return { success: false, message: error.message || "An error occurred." };
  }
}

export async function triggerKeywordNewsRefresh(keyword: string) {
  try {
    const endpointUrl = buildApiUrl('/news/refresh');

    const res = await fetch(endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: keyword, source_slug: null }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to trigger refresh");
    }

    const data = await res.json();
    revalidatePath("/keywords");
    return { success: true, message: data.message };
  } catch (error: any) {
    console.error("Error refreshing keyword news:", error);
    return { success: false, message: error.message || "An error occurred." };
  }
}

export async function createCustomSource(formData: FormData) {
  const name = formData.get("name")?.toString();
  const sourceSlug = formData.get("source_slug")?.toString();

  if (!name || !sourceSlug) {
    return { success: false, message: "Name and Domains/Slugs are required." };
  }

  try {
    const endpointUrl = buildApiUrl('/sources/');

    const res = await fetch(endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, source_slug: sourceSlug }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to create source");
    }

    revalidatePath("/sources");
    return { success: true, message: "Custom source created successfully!" };
  } catch (error: any) {
    console.error("Error creating custom source:", error);
    return { success: false, message: error.message || "An error occurred." };
  }
}

export async function updateCustomSource(id: number, formData: FormData) {
  const name = formData.get("name")?.toString();
  const sourceSlug = formData.get("source_slug")?.toString();
  const advancedQuery = formData.get("advanced_query")?.toString();

  try {
    const endpointUrl = buildApiUrl(`/sources/${id}`);

    const res = await fetch(endpointUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        name, 
        source_slug: sourceSlug,
        advanced_query: advancedQuery
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to update source");
    }

    revalidatePath(`/sources/${id}`);
    revalidatePath("/sources");
    return { success: true, message: "Source updated successfully!" };
  } catch (error: any) {
    console.error("Error updating custom source:", error);
    return { success: false, message: error.message || "An error occurred." };
  }
}

export async function editKeyword(id: number, formData: FormData) {
  const keyword = formData.get("keyword")?.toString();
  const discription = formData.get("discription")?.toString();
  const advancedQuery = formData.get("advanced_query")?.toString();
  const excludeDomains = formData.get("exclude_domains")?.toString();

  try {
    const endpointUrl = buildApiUrl(`/keywords/${id}`);

    const res = await fetch(endpointUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        keyword, 
        discription,
        advanced_query: advancedQuery,
        exclude_domains: excludeDomains
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to update keyword");
    }

    revalidatePath(`/keywords/${id}`);
    revalidatePath("/keywords");
    return { success: true, message: "Keyword updated successfully!" };
  } catch (error: any) {
    console.error("Error editing keyword:", error);
    return { success: false, message: error.message || "An error occurred." };
  }
}

export async function toggleSourcePin(id: number, is_pinned: boolean) {
  try {
    const endpointUrl = buildApiUrl(`/sources/${id}`);
    const res = await fetch(endpointUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ is_pinned }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to update source pin status");
    }

    revalidatePath("/sources");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error toggling source pin:", error);
    return { success: false, message: error.message };
  }
}

export async function toggleKeywordPin(id: number, is_pinned: boolean) {
  try {
    const endpointUrl = buildApiUrl(`/keywords/${id}`);
    const res = await fetch(endpointUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ is_pinned }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to update keyword pin status");
    }

    revalidatePath("/keywords");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error toggling keyword pin:", error);
    return { success: false, message: error.message };
  }
}

// ─── Article Action Server Actions ───────────────────────────────────

export async function createArticleAction(
  articleId: number,
  actionType: string,
  description?: string
) {
  try {
    const endpointUrl = buildApiUrl(`/actions/${articleId}`);
    const res = await fetch(endpointUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action_type: actionType, description }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to create action");
    }

    const data = await res.json();
    revalidatePath("/news");
    revalidatePath("/collections");
    return { success: true, data };
  } catch (error: any) {
    console.error("Error creating article action:", error);
    return { success: false, message: error.message || "An error occurred." };
  }
}

export async function removeArticleAction(
  articleId: number,
  actionType: string
) {
  try {
    const endpointUrl = buildApiUrl(`/actions/${articleId}/${actionType}`);
    const res = await fetch(endpointUrl, { method: "DELETE" });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to remove action");
    }

    revalidatePath("/news");
    revalidatePath("/collections");
    return { success: true, message: `Action '${actionType}' removed.` };
  } catch (error: any) {
    console.error("Error removing article action:", error);
    return { success: false, message: error.message || "An error occurred." };
  }
}

export async function deleteArticle(articleId: number) {
  try {
    const endpointUrl = buildApiUrl(`/news/${articleId}`);
    const res = await fetch(endpointUrl, { method: "DELETE" });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to delete article");
    }

    revalidatePath("/news");
    revalidatePath("/collections");
    return { success: true, message: "Article deleted permanently." };
  } catch (error: any) {
    console.error("Error deleting article:", error);
    return { success: false, message: error.message || "An error occurred." };
  }
}

export async function bulkDeleteNews(
  keywordIds?: number[],
  sourceIds?: number[],
  search?: string
) {
  if ((!keywordIds || keywordIds.length === 0) && (!sourceIds || sourceIds.length === 0) && !search) {
    return { success: false, message: "Must provide keywords, sources, or a search term." };
  }

  try {
    const params = new URLSearchParams();
    if (keywordIds && keywordIds.length > 0) params.append("keyword_ids", keywordIds.join(","));
    if (sourceIds && sourceIds.length > 0) params.append("source_ids", sourceIds.join(","));
    if (search) params.append("search", search);

    const endpointUrl = buildApiUrl(`/news/bulk?${params.toString()}`);
    const res = await fetch(endpointUrl, { method: "DELETE" });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to bulk delete news");
    }

    const data = await res.json();
    revalidatePath("/news");
    revalidatePath("/keywords");
    revalidatePath("/sources");
    return { success: true, message: data.message };
  } catch (error: any) {
    console.error("Error bulk deleting news:", error);
    return { success: false, message: error.message || "An error occurred." };
  }
}

export async function deleteKeyword(id: number) {
  try {
    const endpointUrl = buildApiUrl(`/keywords/${id}`);
    const res = await fetch(endpointUrl, { method: "DELETE" });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to delete keyword");
    }

    revalidatePath("/keywords");
    revalidatePath("/");
    return { success: true, message: "Keyword and its associated data deleted successfully." };
  } catch (error: any) {
    console.error("Error deleting keyword:", error);
    return { success: false, message: error.message || "An error occurred." };
  }
}

export async function deleteSource(id: number) {
  try {
    const endpointUrl = buildApiUrl(`/sources/${id}`);
    const res = await fetch(endpointUrl, { method: "DELETE" });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to delete source");
    }

    revalidatePath("/sources");
    revalidatePath("/");
    return { success: true, message: "Source and its associated data deleted successfully." };
  } catch (error: any) {
    console.error("Error deleting source:", error);
    return { success: false, message: error.message || "An error occurred." };
  }
}
