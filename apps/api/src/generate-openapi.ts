import "reflect-metadata";
import { writeFileSync } from "fs";
import { join } from "path";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function generateOpenApiDocument() {
  try {
    const app = await NestFactory.create(AppModule, { logger: false });

    const config = new DocumentBuilder().setTitle("thanks-claude API").build();
    const document = SwaggerModule.createDocument(app, config);

    writeFileSync(join(__dirname, "..", "openapi.json"), JSON.stringify(document, null, 2));

    await app.close();
  } catch (error) {
    console.error("Failed to generate OpenAPI document:", error);
    process.exit(1);
  }
}

generateOpenApiDocument();
