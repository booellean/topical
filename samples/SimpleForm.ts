import { Topic, TextPrompt, ValidatorResult } from '../src/topical';
import { Activity } from 'botbuilder';

export interface SimpleFormMetadata {
    type: string;
    prompt: string | Activity;
}

export type SimpleFormSchema = Record<string, SimpleFormMetadata>;

export type SimpleFormData = Record<string, string>;

export interface SimpleFormState {
    schema: SimpleFormSchema;
    form: SimpleFormData;
}

export class SimpleForm extends Topic<SimpleFormSchema, SimpleFormState, SimpleFormData> {
    
    async onStart(
        schema: SimpleFormSchema,
    ) {
        this.state.schema = schema;
        this.state.form = {};

        await this.next();
    }

    async next () {
        for (const [name, metadata] of Object.entries(this.state.schema)) {
            if (!this.state.form[name]) {

                if (metadata.type !== 'string')
                    throw `not expecting type "${metadata.type}"`;

                await this.startChild(TextPrompt, {
                    name,
                    prompt: metadata.prompt,
                });
                return;
            }
        }

        await this.end(this.state.form);
    }

    async onDispatch() {
        if (!await this.dispatchToChild())
            throw "a prompt should always be active";
    }

    async onChildEnd(
        child: TextPrompt,
    ) {
        const metadata = this.state.schema[child.return!.args!.name!];

        if (metadata.type !== 'string')
            throw `not expecting type "${metadata.type}"`;

        this.state.form[child.return!.args!.name!] = child.return!.result.value!;

        await this.next();
    }
}
SimpleForm.register();