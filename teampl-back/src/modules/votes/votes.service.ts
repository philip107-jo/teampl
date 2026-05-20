import { prisma } from '../../prisma';

export const VotesService = {
  // 프로젝트의 투표 목록 조회
  getVotes: async (projectId: number, userEmail: string) => {
    const votes = await prisma.vote.findMany({
      where: { projectId },
      include: {
        options: {
          include: {
            records: true
          },
          orderBy: { order: 'asc' }
        },
        records: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // 각 투표에 유저가 투표했는지, 총 투표 수 등의 정보를 덧붙임
    return votes.map(vote => {
      const totalVotes = vote.records.length;
      const myRecords = vote.records.filter(r => r.userEmail === userEmail);
      const myOptionIds = myRecords.map(r => r.optionId);
      const isExpired = vote.deadline ? new Date(vote.deadline) < new Date() : false;

      return {
        id: vote.id,
        projectId: vote.projectId,
        title: vote.title,
        description: vote.description,
        isAnonymous: vote.isAnonymous,
        isMultiple: vote.isMultiple,
        deadline: vote.deadline,
        creatorEmail: vote.creatorEmail,
        createdAt: vote.createdAt,
        isExpired,
        totalVotes,
        myOptionIds,
        options: vote.options.map(opt => {
          const optVotes = vote.records.filter(r => r.optionId === opt.id).length;
          return {
            id: opt.id,
            text: opt.text,
            order: opt.order,
            voteCount: optVotes,
            percentage: totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0,
            // 익명 투표면 누가 투표했는지 숨김
            voters: vote.isAnonymous
              ? []
              : vote.records.filter(r => r.optionId === opt.id).map(r => r.userEmail),
          };
        }),
      };
    });
  },

  // 투표 생성
  createVote: async (
    projectId: number,
    userEmail: string,
    data: {
      title: string;
      description?: string;
      isAnonymous: boolean;
      isMultiple: boolean;
      deadline?: string;
      options: string[];
    }
  ) => {
    // 멤버 확인
    const member = await prisma.projectMember.findUnique({
      where: { userEmail_projectId: { userEmail, projectId } }
    });
    if (!member || member.status !== 'ACTIVE') {
      throw new Error('프로젝트 멤버만 투표를 생성할 수 있습니다.');
    }

    if (!data.options || data.options.length < 2) {
      throw new Error('선택지는 최소 2개 이상 필요합니다.');
    }

    return await prisma.vote.create({
      data: {
        projectId,
        title: data.title,
        description: data.description,
        isAnonymous: data.isAnonymous,
        isMultiple: data.isMultiple,
        deadline: data.deadline ? new Date(data.deadline) : null,
        creatorEmail: userEmail,
        options: {
          create: data.options.map((text, i) => ({ text, order: i }))
        }
      },
      include: {
        options: { orderBy: { order: 'asc' } }
      }
    });
  },

  // 투표 행사
  castVote: async (
    projectId: number,
    voteId: number,
    userEmail: string,
    optionIds: number[]
  ) => {
    // 멤버 확인
    const member = await prisma.projectMember.findUnique({
      where: { userEmail_projectId: { userEmail, projectId } }
    });
    if (!member || member.status !== 'ACTIVE') {
      throw new Error('프로젝트 멤버만 투표할 수 있습니다.');
    }

    const vote = await prisma.vote.findUnique({
      where: { id: voteId },
      include: { records: true }
    });
    if (!vote) throw new Error('투표를 찾을 수 없습니다.');
    if (vote.projectId !== projectId) throw new Error('잘못된 접근입니다.');

    // 마감 확인
    if (vote.deadline && new Date(vote.deadline) < new Date()) {
      throw new Error('마감된 투표입니다.');
    }

    // 단일 선택인데 여러 개 선택한 경우
    if (!vote.isMultiple && optionIds.length > 1) {
      throw new Error('단일 선택 투표입니다.');
    }

    // 이미 투표했는지 확인 (재투표 = 기존 기록 삭제 후 새로 추가)
    await prisma.voteRecord.deleteMany({
      where: { voteId, userEmail }
    });

    // 새 투표 기록 생성
    await prisma.voteRecord.createMany({
      data: optionIds.map(optionId => ({ voteId, optionId, userEmail })),
      skipDuplicates: true
    });

    return { success: true };
  },

  // 투표 삭제 (작성자 또는 팀장만)
  deleteVote: async (projectId: number, voteId: number, userEmail: string) => {
    const vote = await prisma.vote.findUnique({ where: { id: voteId } });
    if (!vote) throw new Error('투표를 찾을 수 없습니다.');

    const member = await prisma.projectMember.findUnique({
      where: { userEmail_projectId: { userEmail, projectId } }
    });

    const isCreator = vote.creatorEmail === userEmail;
    const isLeader = member?.role === 'LEADER';

    if (!isCreator && !isLeader) {
      throw new Error('투표를 삭제할 권한이 없습니다.');
    }

    await prisma.vote.delete({ where: { id: voteId } });
    return { success: true };
  }
};
