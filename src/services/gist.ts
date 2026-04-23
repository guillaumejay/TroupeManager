import type { CampaignState } from "../types";
import { migrateEvents } from "../utils/migration";

const GIST_API = "https://api.github.com/gists";
const FILENAME = "troupe-manager.json";

export type GistErrorCode = "UNAUTHORIZED" | "NOT_FOUND" | "RATE_LIMIT" | "NETWORK" | "PARSE";

export class GistError extends Error {
	readonly code: GistErrorCode;
	constructor(message: string, code: GistErrorCode) {
		super(message);
		this.name = "GistError";
		this.code = code;
	}
}

interface GistFile {
	content: string;
}

interface GistResponse {
	id: string;
	files: Record<string, GistFile>;
	updated_at: string;
}

function baseHeaders(token?: string): HeadersInit {
	const headers: Record<string, string> = {
		Accept: "application/vnd.github+json",
		"X-GitHub-Api-Version": "2022-11-28",
	};
	if (token) headers.Authorization = `Bearer ${token}`;
	return headers;
}

function mapHttpError(res: Response): GistError {
	if (res.status === 404) return new GistError("Gist introuvable", "NOT_FOUND");
	if (res.status === 401) return new GistError("Token invalide", "UNAUTHORIZED");
	if (res.status === 403) {
		const remaining = res.headers.get("X-RateLimit-Remaining");
		if (remaining === "0") {
			return new GistError("Limite GitHub atteinte, réessai dans 60s", "RATE_LIMIT");
		}
		return new GistError("Accès refusé", "UNAUTHORIZED");
	}
	return new GistError(`Erreur réseau (${res.status})`, "NETWORK");
}

export function isCampaignState(value: unknown): value is CampaignState {
	if (typeof value !== "object" || value === null) return false;

	const candidate = value as Partial<CampaignState>;
	if (!Array.isArray(candidate.events)) return false;
	if (typeof candidate.dateCourante !== "string") return false;
	if (typeof candidate.dateObservation !== "string") return false;

	if (candidate.highlightedMarineIds !== undefined && !Array.isArray(candidate.highlightedMarineIds)) {
		return false;
	}

	return true;
}

function parseGistContent(gist: GistResponse): CampaignState {
	const file = gist.files[FILENAME];
	if (!file) {
		throw new GistError(`Fichier ${FILENAME} manquant dans le Gist`, "PARSE");
	}
	let parsed: unknown;
	try {
		parsed = JSON.parse(file.content);
	} catch {
		throw new GistError("JSON invalide dans le Gist", "PARSE");
	}
	if (!isCampaignState(parsed)) {
		throw new GistError("Forme de données invalide", "PARSE");
	}
	return {
		...parsed,
		events: migrateEvents(parsed.events),
		highlightedMarineIds: parsed.highlightedMarineIds ?? [],
	};
}

async function request<T>(url: string, init: RequestInit): Promise<T> {
	let res: Response;
	try {
		res = await fetch(url, init);
	} catch {
		throw new GistError("Impossible de joindre GitHub", "NETWORK");
	}
	if (!res.ok) throw mapHttpError(res);
	try {
		return (await res.json()) as T;
	} catch {
		throw new GistError("Réponse GitHub illisible", "PARSE");
	}
}

export async function fetchGist(gistId: string): Promise<CampaignState> {
	const gist = await request<GistResponse>(`${GIST_API}/${gistId}`, {
		method: "GET",
		headers: baseHeaders(),
	});
	return parseGistContent(gist);
}

export async function createGist(state: CampaignState, token: string): Promise<string> {
	const body = {
		description: "TroupeManager — campagne",
		public: false,
		files: {
			[FILENAME]: { content: JSON.stringify(state) },
		},
	};
	const gist = await request<GistResponse>(GIST_API, {
		method: "POST",
		headers: { ...baseHeaders(token), "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
	return gist.id;
}

export async function updateGist(gistId: string, state: CampaignState, token: string): Promise<void> {
	const body = {
		files: {
			[FILENAME]: { content: JSON.stringify(state) },
		},
	};
	await request<GistResponse>(`${GIST_API}/${gistId}`, {
		method: "PATCH",
		headers: { ...baseHeaders(token), "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
}
