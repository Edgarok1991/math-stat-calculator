import { Controller, Post, Body } from '@nestjs/common';
import { PhotomathService } from './photomath.service';

@Controller('photomath')
export class PhotomathController {
  constructor(private readonly photomathService: PhotomathService) {}

  @Post('ocr')
  async recognizeImage(@Body() body: { image: string }) {
    return this.photomathService.recognizeImage(body.image);
  }
}
