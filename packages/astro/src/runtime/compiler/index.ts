// NOTE: Although this entrypoint is exported, it is internal API and may change at any time.

export {
	Fragment,
	addAttribute,
	createAstro,
	createComponent,
	createTransitionScope,
	defineScriptVars,
	defineStyleVars,
	defineArgs,
	maybeRenderHead,
	mergeSlots,
	render,
	renderComponent,
	renderHead,
	renderSlot,
	renderTransition,
	spreadAttributes,
	unescapeHTML,
} from '../server/index.js';
