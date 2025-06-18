import { Injectable } from "@nestjs/common";
import axios from "axios";
import { ConfigService } from "@nestjs/config";

type GitHubContentItem = {
  type: string;
  name: string;
  [key: string]: any;
};

@Injectable()
export class GitHubService {
  private readonly githubApiBaseUrl: string;
  private readonly githubToken: string;

  constructor(private readonly configService: ConfigService) {
    const owner = this.configService.get<string>("GITHUB_OWNER");
    const repo = this.configService.get<string>("GITHUB_REPO");
    this.githubToken = this.configService.get<string>("GITHUB_TOKEN");
    this.githubApiBaseUrl = `https://api.github.com/repos/${owner}/${repo}/contents`;
  }

  private getAuthHeaders() {
    return this.githubToken
      ? {
        Authorization: `Bearer ${this.githubToken}`,
        Accept: "application/vnd.github.v3+json",
      }
      : { Accept: "application/vnd.github.v3+json" };
  }

  private async fetchContent(path: string): Promise<any> {
    const url = `${this.githubApiBaseUrl}/${path}`;
    try {
      const response = await axios.get(url, { headers: this.getAuthHeaders() });
      return response.data;
    } catch (error: any) {
      console.error(
        `Ошибка при запросе к GitHub: ${path}`,
        error.response?.data || error.message,
      );
      throw new Error(`Не удалось получить данные с GitHub: ${path}`);
    }
  }

  async getMarkdownFileContent(path: string): Promise<string> {
    const data = await this.fetchContent(path);
    const buffer = Buffer.from(data.content, "base64");
    return buffer.toString("utf-8");
  }

  async getJsonFileContent(path: string): Promise<any> {
    try {
      const raw = await this.getMarkdownFileContent(path);
      return JSON.parse(raw);
    } catch (error: any) {
      console.error(`Ошибка парсинга JSON файла ${path}:`, error.message);
      throw new Error("Не удалось распарсить JSON файл");
    }
  }

  async getDirectoryList(path: string): Promise<string[]> {
    const data = await this.fetchContent(path);
    if (!Array.isArray(data)) {
      throw new Error(
        `Ожидался список файлов в директории, но получен другой формат`,
      );
    }

    const items = data as GitHubContentItem[];

    return items.filter((item) => item.type === "dir").map((item) => item.name);
  }
}
