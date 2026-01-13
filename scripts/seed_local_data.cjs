const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const contents = fs.readFileSync(envPath, 'utf8');
  contents.split(/\r?\n/).forEach((line) => {
    if (!line || line.startsWith('#')) return;
    const match = line.match(/^([^=]+)=(.*)$/);
    if (!match) return;
    const key = match[1].trim();
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  });
}

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl =
  process.env.SUPABASE_LOCAL_URL ||
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL;
const serviceRoleKey =
  process.env.SUPABASE_LOCAL_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const anonKey =
  process.env.SUPABASE_LOCAL_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase URL or service role key in .env.local.');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const anonClient = anonKey
  ? createClient(supabaseUrl, anonKey, { auth: { persistSession: false } })
  : null;

const devUser = {
  email: 'dev@localhost.com',
  password: 'dev123456',
  metadata: { full_name: 'Development User', role: 'admin' },
};

const now = new Date();
const daysAgo = (days) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

const randomId = () => crypto.randomUUID();
const sample = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

async function getDevUserId() {
  if (anonClient) {
    const { data, error } = await anonClient.auth.signInWithPassword({
      email: devUser.email,
      password: devUser.password,
    });
    if (!error && data?.user?.id) {
      return data.user.id;
    }
  }

  const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
    email: devUser.email,
    password: devUser.password,
    email_confirm: true,
    user_metadata: devUser.metadata,
  });

  if (createError && !createError.message?.includes('already registered')) {
    throw createError;
  }

  if (createData?.user?.id) {
    return createData.user.id;
  }

  const { data: listData, error: listError } = await adminClient.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listError) {
    throw listError;
  }
  const match = listData?.users?.find((user) => user.email === devUser.email);
  if (!match) {
    throw new Error('Unable to find or create dev user.');
  }
  return match.id;
}

async function deleteAll(table) {
  const { error } = await adminClient
    .from(table)
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) {
    throw error;
  }
}

async function main() {
  const devUserId = await getDevUserId();

  const boardOneId = randomId();
  const boardTwoId = randomId();
  const boardThreeId = randomId();

  const sampleUserA = randomId();
  const sampleUserB = randomId();
  const sampleUserC = randomId();

  console.log('Clearing existing data...');
  await deleteAll('support_messages');
  await deleteAll('support_threads');
  await deleteAll('feedback_responses');
  await deleteAll('feedback');
  await deleteAll('roadmap_updates');
  await deleteAll('roadmap_items');
  await deleteAll('doc_comments');
  await deleteAll('doc_queue');
  await deleteAll('doc_pages');
  await deleteAll('changelog_entries');
  await deleteAll('board_access_rules');
  await deleteAll('board_roles');
  await deleteAll('boards');

  const boards = [
    {
      id: boardOneId,
      name: 'Brightside',
      slug: 'brightside',
      description: 'Customer voice for a productivity platform.',
      logo_url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=200&q=80',
      primary_color: '#0f172a',
      visibility: 'public',
      support_enabled: true,
      settings: {
        allow_attachments: true,
        feedback_requires_approval: false,
        show_staff_names: true,
        default_feedback_visibility: 'public',
      },
      status: 'active',
      created_at: daysAgo(45),
    },
    {
      id: boardTwoId,
      name: 'Orchard Labs',
      slug: 'orchard-labs',
      description: 'Internal feedback and roadmap hub.',
      logo_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=200&q=80',
      primary_color: '#1e293b',
      visibility: 'restricted',
      support_enabled: true,
      settings: {
        allow_attachments: true,
        feedback_requires_approval: true,
        show_staff_names: false,
        default_feedback_visibility: 'private',
      },
      status: 'active',
      created_at: daysAgo(30),
    },
    {
      id: boardThreeId,
      name: 'Pioneer Health',
      slug: 'pioneer-health',
      description: 'Public roadmap and changelog for a wellness app.',
      logo_url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=200&q=80',
      primary_color: '#0f766e',
      visibility: 'public',
      support_enabled: false,
      settings: {
        allow_attachments: false,
        feedback_requires_approval: false,
        show_staff_names: true,
        default_feedback_visibility: 'public',
      },
      status: 'active',
      created_at: daysAgo(20),
    },
  ];

  console.log('Seeding boards...');
  await adminClient.from('boards').insert(boards);

  const boardRoles = [
    {
      id: randomId(),
      board_id: boardOneId,
      user_id: devUserId,
      email: devUser.email,
      role: 'admin',
      assigned_via: 'explicit',
      created_at: daysAgo(40),
    },
    {
      id: randomId(),
      board_id: boardTwoId,
      user_id: devUserId,
      email: devUser.email,
      role: 'admin',
      assigned_via: 'explicit',
      created_at: daysAgo(25),
    },
    {
      id: randomId(),
      board_id: boardThreeId,
      user_id: devUserId,
      email: devUser.email,
      role: 'admin',
      assigned_via: 'explicit',
      created_at: daysAgo(15),
    },
    {
      id: randomId(),
      board_id: boardOneId,
      user_id: sampleUserA,
      email: 'jasmine@brightside.io',
      role: 'support',
      assigned_via: 'explicit',
      created_at: daysAgo(35),
    },
    {
      id: randomId(),
      board_id: boardTwoId,
      user_id: sampleUserB,
      email: 'raj@orchardlabs.com',
      role: 'contributor',
      assigned_via: 'explicit',
      created_at: daysAgo(21),
    },
    {
      id: randomId(),
      board_id: boardThreeId,
      user_id: sampleUserC,
      email: 'lina@pioneerhealth.com',
      role: 'support',
      assigned_via: 'explicit',
      created_at: daysAgo(10),
    },
  ];

  console.log('Seeding board roles...');
  await adminClient.from('board_roles').insert(boardRoles);

  const accessRules = [
    {
      id: randomId(),
      board_id: boardOneId,
      pattern: '@brightside.io',
      pattern_type: 'domain',
      default_role: 'viewer',
      is_active: true,
    },
    {
      id: randomId(),
      board_id: boardTwoId,
      pattern: '@orchardlabs.com',
      pattern_type: 'domain',
      default_role: 'contributor',
      is_active: true,
    },
  ];

  console.log('Seeding access rules...');
  await adminClient.from('board_access_rules').insert(accessRules);

  const feedbackTitles = [
    'Bulk invite workflow needs a preview',
    'Mobile page loads slowly on LTE',
    'Need custom status labels',
    'Search needs saved filters',
    'Export feedback to CSV',
    'Roadmap should support dependencies',
    'Docs editor needs autosave',
    'Changelog should support images',
    'Notifications are too noisy',
    'Allow anonymous feedback toggle',
    'Better mobile navigation',
    'Support inbox needs tags',
    'Feedback votes should show trends',
    'Add dark mode to board view',
    'Need SLA timers on support tickets',
  ];
  const feedbackDescriptions = [
    'Would love a lightweight summary step before confirming.',
    'Seeing a lot of latency on slower connections.',
    'Custom naming would help with internal alignment.',
    'Saved filters would help power users.',
    'Exporting reports weekly would be helpful.',
    'Dependencies help with planning.',
    'Autosave would prevent lost edits.',
    'Visual changelog entries improve adoption.',
    'Email digests would reduce noise.',
  ];
  const feedbackTypes = ['bug', 'feature_request', 'improvement', 'question'];
  const feedbackStatuses = [
    'open',
    'under_review',
    'planned',
    'in_progress',
    'completed',
    'closed',
    'declined',
  ];
  const feedbackPriorities = ['low', 'medium', 'high', 'critical'];
  const feedbackTags = [
    'workflow',
    'performance',
    'mobile',
    'customization',
    'docs',
    'support',
    'alerts',
    'export',
    'analytics',
  ];
  const submitters = [
    { id: sampleUserA, email: 'tori@brightside.io' },
    { id: sampleUserB, email: 'sasha@orchardlabs.com' },
    { id: sampleUserC, email: 'lina@pioneerhealth.com' },
    { id: randomId(), email: 'andrea@customer.com' },
    { id: randomId(), email: 'maria@client.dev' },
  ];

  const feedbackItems = [];
  const feedbackByBoard = new Map();
  const boardsForFeedback = [boardOneId, boardTwoId, boardThreeId];
  boardsForFeedback.forEach((boardId, boardIndex) => {
    const count = boardIndex === 1 ? 14 : 18;
    for (let i = 0; i < count; i += 1) {
      const submitter = sample(submitters);
      const feedbackId = randomId();
      const item = {
        id: feedbackId,
        board_id: boardId,
        title: `${sample(feedbackTitles)}`,
        type: sample(feedbackTypes),
        description: sample(feedbackDescriptions),
        status: sample(feedbackStatuses),
        priority: sample(feedbackPriorities),
        tags: [sample(feedbackTags), sample(feedbackTags)],
        visibility: boardId === boardTwoId ? 'private' : 'public',
        vote_count: randomBetween(2, 120),
        submitter_id: submitter.id,
        submitter_email: submitter.email,
        created_at: daysAgo(randomBetween(2, 40)),
      };
      feedbackItems.push(item);
      if (!feedbackByBoard.has(boardId)) {
        feedbackByBoard.set(boardId, []);
      }
      feedbackByBoard.get(boardId).push(item);
    }
  });

  console.log('Seeding feedback...');
  await adminClient.from('feedback').insert(feedbackItems);

  const feedbackResponses = [];
  const responseSnippets = [
    'Thanks for the detail! We are planning this for the next sprint.',
    'Great catch. We will add this to the roadmap shortly.',
    'We are already investigating this issue.',
    'This is on our radar. We will share updates here.',
    'Appreciate the suggestion. We will follow up.',
  ];
  feedbackItems.forEach((item) => {
    const responseCount = item.board_id === boardOneId ? randomBetween(1, 3) : randomBetween(0, 2);
    for (let i = 0; i < responseCount; i += 1) {
      feedbackResponses.push({
        id: randomId(),
        feedback_id: item.id,
        board_id: item.board_id,
        content: sample(responseSnippets),
        is_official: i === 0,
        author_id: devUserId,
        author_role: 'admin',
        created_at: daysAgo(randomBetween(1, 12)),
      });
    }
  });

  console.log('Seeding feedback responses...');
  await adminClient.from('feedback_responses').insert(feedbackResponses);

  const roadmapTitles = [
    'Invite flow improvements',
    'Mobile performance pass',
    'Weekly feedback digest',
    'Shared status templates',
    'Workflow automation rules',
    'Docs search improvements',
    'Changelog tagging refresh',
    'Support SLA dashboard',
    'Roadmap dependencies',
    'Customer segments',
  ];
  const roadmapItems = [];
  const roadmapItemsByBoard = new Map();
  boardsForFeedback.forEach((boardId) => {
    const count = boardId === boardTwoId ? 6 : 9;
    for (let i = 0; i < count; i += 1) {
      const id = randomId();
      const linked = feedbackByBoard.get(boardId)?.slice(0, 3).map((item) => item.id) || [];
      const item = {
        id,
        board_id: boardId,
        title: sample(roadmapTitles),
        description: sample(feedbackDescriptions),
        status: sample(['planned', 'in_progress', 'shipped']),
        target_quarter: sample(['Q1 2026', 'Q2 2026', 'Q3 2026']),
        tags: [sample(feedbackTags)],
        display_order: i + 1,
        visibility: boardId === boardTwoId ? 'internal' : 'public',
        linked_feedback_ids: linked,
        created_at: daysAgo(randomBetween(4, 28)),
      };
      roadmapItems.push(item);
      if (!roadmapItemsByBoard.has(boardId)) {
        roadmapItemsByBoard.set(boardId, []);
      }
      roadmapItemsByBoard.get(boardId).push(item);
    }
  });

  console.log('Seeding roadmap items...');
  await adminClient.from('roadmap_items').insert(roadmapItems);

  const roadmapUpdates = [];
  const roadmapUpdateSnippets = [
    'Designs are approved. Engineering work is underway.',
    'Audit completed. Biggest wins identified.',
    'We are starting QA and stakeholder review.',
    'Implementation is 60% complete.',
    'We are finalizing copy and visuals.',
  ];
  roadmapItems.forEach((item) => {
    const updateCount = randomBetween(1, 3);
    for (let i = 0; i < updateCount; i += 1) {
      roadmapUpdates.push({
        id: randomId(),
        roadmap_item_id: item.id,
        board_id: item.board_id,
        content: sample(roadmapUpdateSnippets),
        author_id: devUserId,
        update_type: sample(['progress', 'status_change', 'announcement']),
        created_at: daysAgo(randomBetween(1, 14)),
      });
    }
  });

  console.log('Seeding roadmap updates...');
  await adminClient.from('roadmap_updates').insert(roadmapUpdates);

  const changelogTitles = [
    'Realtime board activity',
    'Health dashboard refresh',
    'New feedback sorting',
    'Docs editor improvements',
    'Support inbox filters',
    'Roadmap public view',
    'Changelog reactions',
  ];
  const changelogEntries = [];
  boardsForFeedback.forEach((boardId) => {
    const count = boardId === boardTwoId ? 5 : 8;
    const roadmapIds = roadmapItemsByBoard.get(boardId)?.map((item) => item.id) || [];
    const feedbackIds = feedbackByBoard.get(boardId)?.slice(0, 4).map((item) => item.id) || [];
    for (let i = 0; i < count; i += 1) {
      changelogEntries.push({
        id: randomId(),
        board_id: boardId,
        title: sample(changelogTitles),
        description: sample(feedbackDescriptions),
        release_date: `2026-01-${String(randomBetween(2, 25)).padStart(2, '0')}`,
        tags: [sample(feedbackTags), sample(feedbackTags)],
        visibility: boardId === boardTwoId ? 'internal' : 'public',
        roadmap_item_ids: roadmapIds.slice(0, 2),
        feedback_ids: feedbackIds.slice(0, 2),
        created_at: daysAgo(randomBetween(5, 30)),
      });
    }
  });

  console.log('Seeding changelog entries...');
  await adminClient.from('changelog_entries').insert(changelogEntries);

  const docPages = [];
  const docsByBoard = new Map();
  const docSections = ['Getting Started', 'Best Practices', 'Admin Guide', 'Integrations'];
  const docTopics = [
    'Submitting feedback',
    'Tracking progress',
    'Managing status',
    'Using tags',
    'Sharing updates',
    'Setting visibility',
    'Embedding changelog',
    'Support workflows',
  ];
  boardsForFeedback.forEach((boardId) => {
    const directoryId = randomId();
    docPages.push({
      id: directoryId,
      board_id: boardId,
      title: sample(docSections),
      slug: `section-${boardId.slice(0, 6)}`,
      content: 'Welcome to base25. Start by inviting your first customers.',
      content_type: 'markdown',
      type: 'directory',
      order: 0,
      created_at: daysAgo(randomBetween(20, 40)),
    });
    for (let i = 0; i < 6; i += 1) {
      const id = randomId();
      docPages.push({
        id,
        board_id: boardId,
        parent_id: directoryId,
        title: sample(docTopics),
        slug: `doc-${boardId.slice(0, 4)}-${i + 1}`,
        content: sample(feedbackDescriptions),
        content_type: 'markdown',
        type: 'page',
        order: i + 1,
        created_at: daysAgo(randomBetween(10, 30)),
      });
      if (!docsByBoard.has(boardId)) {
        docsByBoard.set(boardId, []);
      }
      docsByBoard.get(boardId).push(id);
    }
  });

  console.log('Seeding doc pages...');
  await adminClient.from('doc_pages').insert(docPages);

  const docComments = [];
  const docCommentSnippets = [
    'Would love an example of a great feedback submission.',
    'This page was super helpful for onboarding.',
    'Can you clarify the visibility settings?',
    'What is the recommended workflow here?',
    'Great guide, thank you!',
  ];
  docPages
    .filter((page) => page.type === 'page')
    .forEach((page) => {
      const commentCount = randomBetween(1, 3);
      for (let i = 0; i < commentCount; i += 1) {
        docComments.push({
          id: randomId(),
          board_id: page.board_id,
          doc_page_id: page.id,
          content: sample(docCommentSnippets),
          author_id: sample(submitters).id,
          author_email: sample(submitters).email,
          is_question: Math.random() > 0.5,
          is_answered: Math.random() > 0.5,
          created_at: daysAgo(randomBetween(2, 14)),
        });
      }
    });

  console.log('Seeding doc comments...');
  await adminClient.from('doc_comments').insert(docComments);

  const docQueueItems = [];
  changelogEntries.forEach((entry) => {
    if (Math.random() > 0.6) return;
    docQueueItems.push({
      id: randomId(),
      board_id: entry.board_id,
      changelog_entry_id: entry.id,
      title: `Document ${entry.title.toLowerCase()}`,
      status: sample(['pending', 'docs_exist', 'docs_created']),
      created_at: daysAgo(randomBetween(3, 18)),
    });
  });

  console.log('Seeding doc queue...');
  await adminClient.from('doc_queue').insert(docQueueItems);

  const supportSubjects = [
    'Can we export feedback weekly?',
    'SSO setup help',
    'Billing question',
    'Custom domain setup',
    'Need help with access rules',
    'Board visibility change',
    'Reset user password',
    'Support inbox automation',
    'Integration with Slack',
  ];
  const supportThreads = [];
  const supportThreadsByBoard = new Map();
  boardsForFeedback.forEach((boardId) => {
    const count = boardId === boardTwoId ? 8 : 12;
    for (let i = 0; i < count; i += 1) {
      const id = randomId();
      const requester = sample(submitters);
      const thread = {
        id,
        board_id: boardId,
        subject: sample(supportSubjects),
        status: sample(['open', 'awaiting_user', 'awaiting_support', 'resolved', 'closed']),
        priority: sample(['low', 'medium', 'high', 'urgent']),
        requester_id: requester.id,
        requester_email: requester.email,
        assigned_to: devUserId,
        participants: [devUserId],
        tags: [sample(feedbackTags)],
        last_message_at: daysAgo(randomBetween(0, 7)),
        message_count: randomBetween(1, 6),
        created_at: daysAgo(randomBetween(1, 15)),
      };
      supportThreads.push(thread);
      if (!supportThreadsByBoard.has(boardId)) {
        supportThreadsByBoard.set(boardId, []);
      }
      supportThreadsByBoard.get(boardId).push(thread);
    }
  });

  console.log('Seeding support threads...');
  await adminClient.from('support_threads').insert(supportThreads);

  const supportMessages = [];
  const supportReplies = [
    'Absolutely. We can set up a recurring export in settings.',
    'Do you have a SAML IdP metadata file we can review?',
    'We are checking on that and will follow up shortly.',
    'Thanks for the details. We will investigate.',
    'Can you confirm the affected board?',
  ];
  supportThreads.forEach((thread) => {
    const messageCount = randomBetween(1, 4);
    for (let i = 0; i < messageCount; i += 1) {
      supportMessages.push({
        id: randomId(),
        thread_id: thread.id,
        board_id: thread.board_id,
        content: sample(supportReplies),
        author_id: devUserId,
        author_email: devUser.email,
        is_internal_note: Math.random() > 0.7,
        is_staff_reply: true,
        created_at: daysAgo(randomBetween(0, 6)),
      });
    }
  });

  console.log('Seeding support messages...');
  await adminClient.from('support_messages').insert(supportMessages);

  console.log('Done. Seeded demo data for screenshots.');
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
