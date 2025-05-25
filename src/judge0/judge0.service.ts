import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class Judge0Service {
  private readonly apiUrl: string;
  private readonly apiHost: string;
  private readonly apiKey: string;

  constructor(private readonly httpService: HttpService) {
    this.apiUrl = process.env.JUDGE0_API_URL ?? '';
    this.apiHost = process.env.JUDGE0_API_HOST ?? '';
    this.apiKey = process.env.JUDGE0_API_KEY ?? '';
  }

  languageMap = {
    javascript: 63,
    python: 71,
    cpp: 54,
  } as const;

  async createSubmission(
    sourceCode: string,
    language: keyof typeof this.languageMap,
    stdin: string,
  ): Promise<any> {
    const langId = this.languageMap[language];
    if (!langId) {
      throw new Error(`Unsupported language: ${language}`);
    }

    const payload = {
      source_code: sourceCode,
      language_id: langId,
      stdin,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['X-RapidAPI-Key'] = this.apiKey;
      headers['X-RapidAPI-Host'] = this.apiHost;
    }

    const response$ = this.httpService.post<any>(
      `${this.apiUrl}/submissions?base64_encoded=false&wait=true`,
      payload,
      { headers },
    );

    const response = await lastValueFrom(response$);
    return response.data;
  }
}
