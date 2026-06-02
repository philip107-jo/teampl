import nodemailer from 'nodemailer';
import { config } from './config';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

export const sendVerificationEmail = async (to: string, code: string) => {
  if (!config.email.user || !config.email.pass) {
    console.warn('⚠️ Email credentials are not configured in environment variables.');
    throw new Error('Email server is not configured.');
  }

  const mailOptions = {
    from: `"Teampl" <${config.email.user}>`,
    to,
    subject: '[Teampl] 회원가입 이메일 인증번호',
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 40px auto; padding: 32px; border: 1px solid #f1f5f9; border-radius: 24px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #11B886; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">Teampl 회원가입 인증</h2>
          <p style="color: #94a3b8; font-size: 13px; font-weight: 600; margin-top: 4px;">팀플을 더 쉽고 스마트하게</p>
        </div>
        
        <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; text-align: center; font-weight: 500;">
          안녕하세요. Teampl 가입을 환영합니다!<br>
          요청하신 이메일 인증 번호는 아래와 같습니다.
        </p>
        
        <div style="text-align: center; margin: 32px 0;">
          <div style="display: inline-block; font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #0EA271; background-color: #ECFDF5; padding: 16px 32px; border-radius: 16px; border: 1px solid #A7F3D0;">
            ${code}
          </div>
        </div>
        
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-bottom: 32px; font-weight: 600;">
          인증번호는 발송 시간 기준 <span style="color: #EF4444;">5분 동안 유효</span>합니다.
        </p>
        
        <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.5;">
          본 메일은 발신 전용 메일입니다.<br>
          만약 가입 요청을 하지 않으셨다면 이 메일을 무시해 주세요.
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendPasswordResetEmail = async (to: string, code: string) => {
  if (!config.email.user || !config.email.pass) {
    console.warn('⚠️ Email credentials are not configured in environment variables.');
    throw new Error('Email server is not configured.');
  }

  const mailOptions = {
    from: `"Teampl" <${config.email.user}>`,
    to,
    subject: '[Teampl] 비밀번호 재설정 인증번호',
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 40px auto; padding: 32px; border: 1px solid #f1f5f9; border-radius: 24px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #11B886; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">비밀번호 재설정 인증</h2>
          <p style="color: #94a3b8; font-size: 13px; font-weight: 600; margin-top: 4px;">Teampl 계정 보호</p>
        </div>
        
        <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; text-align: center; font-weight: 500;">
          비밀번호 재설정을 위한 인증번호입니다.<br>
          아래의 인증번호를 입력하여 비밀번호를 재설정해주세요.
        </p>
        
        <div style="text-align: center; margin: 32px 0;">
          <div style="display: inline-block; font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #0EA271; background-color: #ECFDF5; padding: 16px 32px; border-radius: 16px; border: 1px solid #A7F3D0;">
            ${code}
          </div>
        </div>
        
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-bottom: 32px; font-weight: 600;">
          인증번호는 발송 시간 기준 <span style="color: #EF4444;">5분 동안 유효</span>합니다.
        </p>
        
        <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.5;">
          본 메일은 발신 전용 메일입니다.<br>
          만약 비밀번호 재설정을 요청하지 않으셨다면 이 메일을 무시해 주세요.
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendWithdrawalVerificationEmail = async (to: string, code: string) => {
  if (!config.email.user || !config.email.pass) {
    console.warn('⚠️ Email credentials are not configured in environment variables.');
    throw new Error('Email server is not configured.');
  }

  const mailOptions = {
    from: `"Teampl" <${config.email.user}>`,
    to,
    subject: '[Teampl] 회원탈퇴 이메일 인증번호',
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 40px auto; padding: 32px; border: 1px solid #f1f5f9; border-radius: 24px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #EF4444; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">회원탈퇴 인증</h2>
          <p style="color: #94a3b8; font-size: 13px; font-weight: 600; margin-top: 4px;">Teampl 계정 탈퇴 안내</p>
        </div>
        
        <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; text-align: center; font-weight: 500;">
          회원탈퇴를 위한 인증번호입니다.<br>
          탈퇴 시 본인의 모든 프로젝트 참여 내역 및 데이터가 소멸됩니다.<br>
          아래의 인증번호를 입력하여 회원탈퇴를 진행해주세요.
        </p>
        
        <div style="text-align: center; margin: 32px 0;">
          <div style="display: inline-block; font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #DC2626; background-color: #FEF2F2; padding: 16px 32px; border-radius: 16px; border: 1px solid #FCA5A5;">
            ${code}
          </div>
        </div>
        
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-bottom: 32px; font-weight: 600;">
          인증번호는 발송 시간 기준 <span style="color: #EF4444;">5분 동안 유효</span>합니다.
        </p>
        
        <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.5;">
          본 메일은 발신 전용 메일입니다.<br>
          만약 탈퇴 요청을 하지 않으셨다면 이 메일을 즉시 무시하시고 비밀번호를 변경해 주세요.
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

