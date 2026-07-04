import { visit } from "unist-util-visit";

export function rehypeImageLoading() {
	return (tree) => {
		visit(tree, "element", (node) => {
			if (node.tagName !== "img") return;

			node.properties ||= {};
			node.properties.loading ||= "lazy";
			node.properties.decoding ||= "async";
		});
	};
}
