/** Essays are finished arguments; notes are thoughts still moving. The folder in content/ decides. */
export type Kind = 'essay' | 'note';

export interface Post {
	/** Path of the source, as import.meta.glob keys it (/content/notes/….md). */
	file: string;
	slug: string;
	kind: Kind;
	title: string;
	/** YYYY-MM-DD */
	date: string;
	updated?: string;
	/** From front matter, or the opening of the text for notes. Plain text; formulas as TeX. */
	description: string;
	/** The same summary as HTML, formulas rendered by KaTeX. */
	summary: string;
	tags: string[];
	draft: boolean;
	minutes: number;
}
