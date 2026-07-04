import type { AstroIntegration } from "@swup/astro";

declare global {
	interface Window {
		// type from '@swup/astro' is incorrect
		swup: AstroIntegration;
		pagefind?: Pagefind;
	}
}

export interface Pagefind {
	options: (options: { excerptLength: number }) => Promise<void> | void;
	init: () => Promise<void> | void;
	search: (query: string) => Promise<{
		results: Array<{
			data: () => Promise<SearchResult>;
		}>;
	}>;
}

export interface SearchResult {
	url: string;
	meta: {
		title: string;
	};
	excerpt: string;
	content?: string;
	word_count?: number;
	filters?: Record<string, unknown>;
	anchors?: Array<{
		element: string;
		id: string;
		text: string;
		location: number;
	}>;
	weighted_locations?: Array<{
		weight: number;
		balanced_score: number;
		location: number;
	}>;
	locations?: number[];
	raw_content?: string;
	raw_url?: string;
	sub_results?: SearchResult[];
}
