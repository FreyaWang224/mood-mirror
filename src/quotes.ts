import type { Mood } from "./types";

export interface QuoteCandidate {
  text: string;
  source: string;
  type: "book" | "movie" | "animation" | "quote" | "poem";
  moods: Mood[];
  tags: string[];
}

export const quoteLibrary: QuoteCandidate[] = [
  {
    text: "请再悄悄加点油，无论如何都想听你说：我终于成为不负众望的人了。",
    source: "《时光序》",
    type: "book",
    moods: ["anxious", "tired"],
    tags: ["努力", "鼓励", "期待"],
  },
  {
    text: "勇气是在压力之下展现出的优雅。",
    source: "海明威",
    type: "quote",
    moods: ["anxious", "angry", "tired"],
    tags: ["勇气", "压力", "优雅"],
  },
  {
    text: "那些你认为不靠谱的人生里，充满你没勇气做的事。",
    source: "未知",
    type: "quote",
    moods: ["anxious", "sad"],
    tags: ["勇气", "选择", "人生"],
  },
  {
    text: "人就是这样的，想来想去，犹豫来犹豫去，觉得自己没有准备好，勇气没攒够，其实只要迈出去了那一步，就会发现其实所有的一切早就准备好了。",
    source: "《撒野》",
    type: "book",
    moods: ["anxious", "tired"],
    tags: ["勇气", "行动", "犹豫"],
  },
  {
    text: "走到生命的哪一个阶段，都该喜欢那一段时光，完成那一阶段该完成的职责，顺生而行。",
    source: "白岩松《痛并快乐着》",
    type: "book",
    moods: ["calm", "tired", "anxious"],
    tags: ["阶段", "顺其自然", "人生"],
  },
  {
    text: "真正的快乐只会来自破碎的心、受过的苦、以及经历过的伤痛。",
    source: "《樱桃的滋味》",
    type: "movie",
    moods: ["sad", "calm"],
    tags: ["痛苦", "快乐", "经历"],
  },
  {
    text: "现在回头看过去，不快乐总是很长的一段时候，而快乐都只是在某个时刻，是稍纵即逝的点缀，是蛋糕上的水果。如果碰到能让你快乐的人，一定要一口一口慢慢吃。",
    source: "颜茹玉",
    type: "quote",
    moods: ["happy", "sad", "calm"],
    tags: ["快乐", "珍惜", "当下"],
  },
  {
    text: "如果世间真有这么一种状态：心灵十分充实和宁静，既不怀恋过去也不奢望将来，放任光阴的流逝而仅仅掌握现在，无匮乏之感也无享受之感，不快乐也不忧愁，既无所求也无所惧，而只感受到自己的存在，处于这种状态的人就可以说自己得到了幸福。",
    source: "卢梭《一个孤独的散步者的梦》",
    type: "book",
    moods: ["calm"],
    tags: ["宁静", "当下", "幸福"],
  },
  {
    text: "人的一切痛苦，本质上都是对自己的无能的愤怒。",
    source: "王小波",
    type: "quote",
    moods: ["angry", "anxious", "sad"],
    tags: ["痛苦", "愤怒", "无力"],
  },
  {
    text: "有些事不是看到了希望才去坚持，而是因为坚持才会看到希望。",
    source: "《十宗罪》",
    type: "book",
    moods: ["anxious", "sad", "tired"],
    tags: ["希望", "坚持", "低谷"],
  },
  {
    text: "星星应该哈哈大笑，反正宇宙是个偏僻的地方。",
    source: "鲍里斯·帕斯捷尔纳克",
    type: "quote",
    moods: ["happy", "calm"],
    tags: ["轻盈", "宇宙", "幽默"],
  },
  {
    text: "世界弥漫着焦躁不安的气息，因为每一个人都急于从自己的枷锁中解放出来。",
    source: "尼采",
    type: "quote",
    moods: ["anxious", "angry", "tired"],
    tags: ["焦躁", "束缚", "释放"],
  },
  {
    text: "有些烦恼，丢掉了，才有云淡风轻的机会。",
    source: "宫崎骏《龙猫》",
    type: "movie",
    moods: ["tired", "calm", "sad"],
    tags: ["放下", "轻盈", "治愈"],
  },
  {
    text: "生活不是你活过的样子，而是你记住的样子。",
    source: "《人生海海》",
    type: "book",
    moods: ["calm", "sad"],
    tags: ["记忆", "生活", "回望"],
  },
  {
    text: "你迷茫的原因在于读书太少而想的太多。",
    source: "杨绛",
    type: "quote",
    moods: ["anxious", "tired"],
    tags: ["迷茫", "行动", "思考"],
  },
  {
    text: "生活如果不宠你，更要自己善待自己。这一生，风雨兼程，就是为了遇见最好的自己，如此而已。",
    source: "未知",
    type: "quote",
    moods: ["sad", "tired", "calm"],
    tags: ["自我接纳", "温柔", "治愈"],
  },
  {
    text: "太阳一直在，只是你没有抬头看而已。",
    source: "未知",
    type: "quote",
    moods: ["sad", "tired", "anxious"],
    tags: ["希望", "光", "治愈"],
  },
  {
    text: "大人们总想着去解释，可他们忘了语言本来就是误会的根源。",
    source: "安东尼·德·圣-埃克苏佩里《小王子》",
    type: "book",
    moods: ["sad", "angry", "anxious"],
    tags: ["误解", "沟通", "关系", "委屈"],
  },
  {
    text: "我们听到的一切都是一个观点，不是事实。我们看见的一切都是一个视角，不是真相。",
    source: "《沉思录》",
    type: "book",
    moods: ["anxious", "angry", "calm"],
    tags: ["视角", "真相", "清醒", "放下"],
  },
  {
    text: "人们很少做他们相信是对的事，他们做比较容易的事，然后后悔。",
    source: "鲍勃·迪伦",
    type: "quote",
    moods: ["anxious", "sad", "tired"],
    tags: ["后悔", "选择", "逃避", "勇气"],
  },
  {
    text: "小时候真傻，居然盼着长大。",
    source: "老舍",
    type: "quote",
    moods: ["sad", "tired"],
    tags: ["长大", "疲惫", "失落", "怀念"],
  },
  {
    text: "每朵云都下落不明，每盏月亮都不知所踪。",
    source: "八月长安《橘生淮南·暗恋》",
    type: "book",
    moods: ["sad", "calm"],
    tags: ["失落", "月亮", "暗恋", "遗憾"],
  },
  {
    text: "人生啊，是这样不可预测，没有永恒的痛苦，也没有永恒的幸福，生活像流水一般，有时是那么平展，有时又是那么曲折。",
    source: "路遥《平凡的世界》",
    type: "book",
    moods: ["sad", "tired", "calm", "anxious"],
    tags: ["人生", "无常", "痛苦", "幸福", "流动"],
  },
  {
    text: "我们的烦恼和痛苦都不是因为事情的本身，而是因为我们加在这些事情上的观念。",
    source: "阿德勒",
    type: "quote",
    moods: ["anxious", "angry", "sad"],
    tags: ["烦恼", "观念", "痛苦", "认知"],
  },
  {
    text: "痛苦，是保持清醒的最好方式。",
    source: "范增《秦时明月》",
    type: "animation",
    moods: ["sad", "angry", "anxious"],
    tags: ["痛苦", "清醒", "成长", "现实"],
  },
  {
    text: "对人类来说，最好的安慰剂就是知道你的痛苦并不特殊。",
    source: "廖一梅《悲观主义的花朵》",
    type: "book",
    moods: ["sad", "tired", "anxious"],
    tags: ["痛苦", "共鸣", "安慰", "不孤单"],
  },
  {
    text: "人时已尽，人世还长，我在中间，应该休息。",
    source: "顾城",
    type: "quote",
    moods: ["tired", "sad", "calm"],
    tags: ["休息", "暂停", "疲惫", "自我照顾"],
  },
  {
    text: "当你感觉忙得没时间休息，就是你最需要找时间休息的时候。",
    source: "马特·海格",
    type: "quote",
    moods: ["tired", "anxious"],
    tags: ["休息", "忙碌", "压力", "提醒"],
  },
  {
    text: "无论如何，现在要做的就是多休息，吹吹风。然后，吃些蜂蜜。就像进入冬眠的熊一样。重要的是，不要被那些你不在场时流逝的时间所囚禁。因为，那里并没有你。",
    source: "森绘都《再次遇见你》",
    type: "book",
    moods: ["tired", "sad", "calm"],
    tags: ["休息", "吹风", "暂停", "恢复", "当下"],
  },
  {
    text: "让我们每天带着希望出门，如果事与愿违，就再把希望带回家，休息休息，明天继续带出门。",
    source: "朱德庸",
    type: "quote",
    moods: ["tired", "sad", "anxious"],
    tags: ["希望", "休息", "明天", "继续"],
  },
];

const fallbackQuotes = quoteLibrary.slice(0, 6);

const priorityTags: Record<Mood, string[]> = {
  calm: ["宁静", "当下", "顺其自然", "平静", "放下"],
  happy: ["快乐", "珍惜", "轻盈", "希望", "宇宙"],
  anxious: ["迷茫", "勇气", "行动", "希望", "压力"],
  sad: ["痛苦", "共鸣", "安慰", "不孤单", "遗憾"],
  tired: ["休息", "暂停", "恢复", "疲惫", "自我照顾"],
  angry: ["清醒", "边界", "委屈", "愤怒", "视角"],
};

function quoteScore(quote: QuoteCandidate, mood: Mood): number {
  const tagScore = quote.tags.reduce(
    (score, tag) => score + (priorityTags[mood].includes(tag) ? 3 : 0),
    0,
  );
  return (quote.moods.includes(mood) ? 10 : 0) + tagScore;
}

export function selectQuoteCandidates(mood: Mood, limit = 8): QuoteCandidate[] {
  const seen = new Set<string>();
  const candidates = [...quoteLibrary]
    .filter((quote) => quote.moods.includes(mood))
    .sort((left, right) => quoteScore(right, mood) - quoteScore(left, mood));

  return [...candidates, ...fallbackQuotes].filter((quote) => {
    const key = `${quote.text}::${quote.source}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  }).slice(0, limit);
}
