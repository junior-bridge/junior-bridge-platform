import { CreateRatingData, Rating } from "@/types/ratingTypes";
import { getCsrfToken } from "./auth.service";
import { apiFetch } from "./index.service";


export async function createRating(
    postulationId: number,
    data: CreateRatingData,
): Promise<Rating> {
    await getCsrfToken();
    return apiFetch<Rating>(`/api/postulations/${postulationId}/rating/`, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function getRating(postulationId: number): Promise<Rating> {
    return apiFetch<Rating>(`/api/postulations/${postulationId}/rating/`);
}

export async function updateRating(
    ratingId: number,
    data: CreateRatingData,
): Promise<Rating> {
    await getCsrfToken();
    return apiFetch<Rating>(`/api/rating/${ratingId}/`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}
