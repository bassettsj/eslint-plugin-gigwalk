// @flow
import _ from 'lodash';
import { isFlowFileAnnotation } from 'eslint-plugin-flowtype/dist/utilities';

const looksLikeFlowFileAnnotation = (comment: string): boolean => {
    return /@flow/i.test(comment);
};

type Context = {
    options: Array<string>,
    getFilename: () => string,
    getAllComments: () => Array<{ value: string }>,
    report: Function
};
function requireValidFlowFileAnnotations(context: Context): any {
    const pattern = new RegExp(context.options[0] || '*');

    const checkThisFile = !pattern.test(context.getFilename());
    if (!checkThisFile) {
        return {};
    }

    return {
        Program (node) {
            const firstToken = node.tokens[0];

            const potentialFlowFileAnnotation = _.find(context.getAllComments(), (comment) => {
                return looksLikeFlowFileAnnotation(comment.value);
            });

            if (potentialFlowFileAnnotation) {
                if (firstToken && firstToken.start < potentialFlowFileAnnotation.start) {
                    context.report(potentialFlowFileAnnotation, 'Flow file annotation not at the top of the file.');
                }

                if (!isFlowFileAnnotation(potentialFlowFileAnnotation.value)) {
                    context.report(potentialFlowFileAnnotation, 'Malformed flow file annotation.');
                }
            } else {
                context.report({
                    node,
                    message: 'Flow file annotation is missing.',
                    fix(fixer) {
                        return fixer.insertTextBefore(node, '// @flow \n');
                    }
                });
            }
        }
    };
}

const schema = [
    {
        type: 'string'
    }
];


requireValidFlowFileAnnotations.schema = schema;

export default requireValidFlowFileAnnotations;
