import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with challenges...');

  // 1. Two Sum
  const twoSum = await prisma.problem.upsert({
    where: { slug: 'two-sum' },
    update: {},
    create: {
      title: 'Two Sum',
      slug: 'two-sum',
      description: `Given an array of integers \`nums\` and an integer \`target\`, return *indices of the two numbers such that they add up to \`target\`*.\n\nYou may assume that each input would have ***exactly* one solution**, and you may not use the *same* element twice.\n\nYou can return the answer in any order.\n\n### Examples\n**Example 1:**\n\`\`\`\nInput: nums = [2,7,11,15], target = 9\nOutput: [0,1]\nExplanation: Because nums[0] + nums[1] == 9, we return [0, 1].\n\`\`\``,
      difficulty: 'EASY',
      tags: ['array', 'hash-table'],
      timeLimit: 2,
      memoryLimit: 256,
      isPublished: true,
      exampleInput: `[2,7,11,15]\n9`,
      exampleOutput: `[0,1]`,
    },
  });

  await prisma.testCase.createMany({
    data: [
      {
        problemId: twoSum.id,
        input: `[2,7,11,15]\n9`,
        expectedOutput: `[0,1]`,
        isExample: true,
        isHidden: false,
      },
      {
        problemId: twoSum.id,
        input: `[3,2,4]\n6`,
        expectedOutput: `[1,2]`,
        isExample: true,
        isHidden: false,
      },
      {
        problemId: twoSum.id,
        input: `[3,3]\n6`,
        expectedOutput: `[0,1]`,
        isExample: false,
        isHidden: true,
      },
    ],
  });

  // 2. Reverse String
  const reverseString = await prisma.problem.upsert({
    where: { slug: 'reverse-string' },
    update: {},
    create: {
      title: 'Reverse String',
      slug: 'reverse-string',
      description: `Write a function that reverses a string. The input string is given as an array of characters \`s\`.\n\nYou must do this by modifying the input array in-place with O(1) extra memory.\n\n### Examples\n**Example 1:**\n\`\`\`\nInput: s = ["h","e","l","l","o"]\nOutput: ["o","l","l","e","h"]\n\`\`\``,
      difficulty: 'EASY',
      tags: ['string', 'two-pointers'],
      timeLimit: 1,
      memoryLimit: 256,
      isPublished: true,
      exampleInput: `["h","e","l","l","o"]`,
      exampleOutput: `["o","l","l","e","h"]`,
    },
  });

  await prisma.testCase.createMany({
    data: [
      {
        problemId: reverseString.id,
        input: `["h","e","l","l","o"]`,
        expectedOutput: `["o","l","l","e","h"]`,
        isExample: true,
        isHidden: false,
      },
      {
        problemId: reverseString.id,
        input: `["H","a","n","n","a","h"]`,
        expectedOutput: `["h","a","n","n","a","H"]`,
        isExample: true,
        isHidden: false,
      },
    ],
  });

  // 3. Fibonacci Number
  const fib = await prisma.problem.upsert({
    where: { slug: 'fibonacci-number' },
    update: {},
    create: {
      title: 'Fibonacci Number',
      slug: 'fibonacci-number',
      description: `The **Fibonacci numbers**, commonly denoted \`F(n)\` form a sequence, called the **Fibonacci sequence**, such that each number is the sum of the two preceding ones, starting from \`0\` and \`1\`.\n\nThat is:\n\`\`\`\nF(0) = 0, F(1) = 1\nF(n) = F(n - 1) + F(n - 2), for n > 1.\n\`\`\`\nGiven \`n\`, calculate \`F(n)\`.\n\n### Examples\n**Example 1:**\n\`\`\`\nInput: n = 2\nOutput: 1\nExplanation: F(2) = F(1) + F(0) = 1 + 0 = 1.\n\`\`\``,
      difficulty: 'EASY',
      tags: ['math', 'dynamic-programming', 'recursion'],
      timeLimit: 1,
      memoryLimit: 256,
      isPublished: true,
      exampleInput: `2`,
      exampleOutput: `1`,
    },
  });

  await prisma.testCase.createMany({
    data: [
      {
        problemId: fib.id,
        input: `2`,
        expectedOutput: `1`,
        isExample: true,
        isHidden: false,
      },
      {
        problemId: fib.id,
        input: `3`,
        expectedOutput: `2`,
        isExample: true,
        isHidden: false,
      },
      {
        problemId: fib.id,
        input: `4`,
        expectedOutput: `3`,
        isExample: false,
        isHidden: true,
      },
    ],
  });

  console.log('Seeding complete! 3 challenges created successfully.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
