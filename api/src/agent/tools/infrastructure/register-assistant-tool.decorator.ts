import { SetMetadata } from '@nestjs/common';

import { ASSISTANT_TOOL_METADATA } from './constants/metadata-keys';

export const RegisterAssistantTool = (): ClassDecorator =>
  SetMetadata(ASSISTANT_TOOL_METADATA, true);
