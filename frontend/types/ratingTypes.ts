

export type Rating = {
    id_rating: number;
    id_postulation: number;
    stars: number;
    comment: string | null;
    created_at: string;
    updated_at: string;
};

export type CreateRatingData = {
    stars: number;
    comment?: string;
};

export type RatingItem = {
    id_rating: number;
    id_postulation: number;
    stars: number;
    comment: string | null;
    created_at: string;
    project_title: string;
    entrepreneur_name: string;
};

export type TesterReputation = {
    reputation: number;
    total_ratings: number;
    ratings: RatingItem[];
};