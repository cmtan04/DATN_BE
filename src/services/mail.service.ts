import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import 'dotenv/config';

@Injectable()
export class MailService {
  private readonly transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASS,
      },
    });
  }

  public async sendMail(
    to: string,
    subject: string,
    html: string,
  ): Promise<void> {
    const mailOptions = {
      from: `"Hệ thống" <${process.env.NODEMAILER_USER}>`,
      to,
      subject,
      html,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Lỗi sendMail:', error);
      throw new InternalServerErrorException(
        'Không thể gửi email, vui lòng thử lại sau.',
      );
    }
  }
}
