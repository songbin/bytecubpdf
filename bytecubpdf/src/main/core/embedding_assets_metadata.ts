// 从Python翻译的TypeScript版本
// 包含资源元数据常量

export const DOCLAYOUT_YOLO_DOCSTRUCTBENCH_IMGSZ1024ONNX_SHA3_256 = "60be061226930524958b5465c8c04af3d7c03bcb0beb66454f5da9f792e3cf2a";

export const TABLE_DETECTION_RAPIDOCR_MODEL_SHA3_256 = "062f4619afe91b33147c033acadecbb53f2a7b99ac703d157b96d5b10948da5e";
export const TABLE_DETECTION_RAPIDOCR_CLS_MODEL_SHA3_256 = "1fe31cb7e7babb2fc4cfe7090b1e93fc538b9a4a36a5f9af72bd6da78c9afc26";
export const TABLE_DETECTION_RAPIDOCR_REC_MODEL_SHA3_256 = "6040d1cb9554886e166fd817af0ab69c5cce8e5e80b8a111c1f08258ad4c4b22";

export const TIKTOKEN_CACHES: Record<string, string> = {
  "fb374d419588a4632f3f557e76b4b70aebbca790": "cb04bcda5782cfbbe77f2f991d92c0ea785d9496ef1137c91dfc3c8c324528d6"
};

export const TIKTOKEN_URL_BY_UPSTREAM: Record<string, (name: string) => string> = {
  "modelscope": (name: string) => `https://www.modelscope.cn/datasets/awwaawwa/BabelDOCAssets/resolve/master/tiktoken_cache/${name}`,
  "huggingface": (name: string) => `https://huggingface.co/arena-data/arena-data/resolve/main/tiktoken_cache/${name}`,
  "github": (name: string) => `https://raw.githubusercontent.com/funstory-ai/BabelDOC-Assets/refs/heads/main/tiktoken_cache/${name}`,
};
export const DOC_LAYOUT_ONNX_MODEL_URL : Record<string, string> = {
    
    "hf-mirror": "https://hf-mirror.com/wybxc/DocLayout-YOLO-DocStructBench-onnx/resolve/main/doclayout_yolo_docstructbench_imgsz1024.onnx?download=true",
    "modelscope": "https://www.modelscope.cn/models/AI-ModelScope/DocLayout-YOLO-DocStructBench-onnx/resolve/master/doclayout_yolo_docstructbench_imgsz1024.onnx",
    "huggingface": "https://huggingface.co/wybxc/DocLayout-YOLO-DocStructBench-onnx/resolve/main/doclayout_yolo_docstructbench_imgsz1024.onnx?download=true",
}
//分类模型
export const TABLE_DETECTION_RAPIDOCR_MODEL_CLS_URL : Record<string, string> = {
    "modelscope": "https://www.modelscope.cn/models/RapidAI/RapidOCR/resolve/master/onnx/PP-OCRv4/cls/ch_ppocr_mobile_v2.0_cls_infer.onnx",
	"hf-mirror": "https://hf-mirror.com/spaces/RapidAI/TableStructureRec/resolve/main/models/ocr/ch_ppocr_mobile_v2.0_cls_infer.onnx",
    "huggingface": "https://huggingface.co/spaces/RapidAI/TableStructureRec/resolve/main/models/ocr/ch_ppocr_mobile_v2.0_cls_infer.onnx",
}

//识别模型
export const TABLE_DETECTION_RAPIDOCR_MODEL_REC_URL : Record<string, string> = {
    "modelscope": "https://www.modelscope.cn/models/RapidAI/RapidOCR/resolve/master/onnx/PP-OCRv4/rec/ch_PP-OCRv4_rec_infer.onnx",
	"hf-mirror": "https://hf-mirror.com/spaces/RapidAI/RapidOCR/resolve/main/models/text_rec/ch_PP-OCRv4_rec_infer.onnx",
    "huggingface": "https://huggingface.co/spaces/RapidAI/RapidOCR/resolve/main/models/text_rec/ch_PP-OCRv4_rec_infer.onnx",
}
export const TABLE_DETECTION_RAPIDOCR_MODEL_URL : Record<string, string> = {
   
    "hf-mirror": "https://hf-mirror.com/spaces/RapidAI/RapidOCR/resolve/main/models/text_det/ch_PP-OCRv4_det_infer.onnx",
    "modelscope": "https://www.modelscope.cn/models/RapidAI/RapidOCR/resolve/master/onnx/PP-OCRv4/det/ch_PP-OCRv4_det_infer.onnx",
    "huggingface": "https://huggingface.co/spaces/RapidAI/RapidOCR/resolve/main/models/text_det/ch_PP-OCRv4_det_infer.onnx",
}
export const FONT_METADATA_URL: Record<string, string> = {
    "modelscope": "https://www.modelscope.cn/datasets/awwaawwa/BabelDOCAssets/resolve/master/font_metadata.json",
    "hf-mirror": "https://hf-mirror.com/datasets/awwaawwa/BabelDOC-Assets/resolve/main/font_metadata.json?download=true",
  "github": "https://raw.githubusercontent.com/funstory-ai/BabelDOC-Assets/refs/heads/main/font_metadata.json",
  "huggingface": "https://huggingface.co/datasets/awwaawwa/BabelDOC-Assets/resolve/main/font_metadata.json?download=true",
  
  
};

export const FONT_URL_BY_UPSTREAM: Record<string, (name: string) => string> = {
    "modelscope": name => `https://www.modelscope.cn/datasets/awwaawwa/BabelDOCAssets/resolve/master/fonts/${name}`,
    "hf-mirror": name => `https://hf-mirror.com/datasets/awwaawwa/BabelDOC-Assets/resolve/main/fonts/${name}?download=true`,
  "github": name => `https://raw.githubusercontent.com/funstory-ai/BabelDOC-Assets/refs/heads/main/fonts/${name}`,
  "huggingface": name => `https://huggingface.co/datasets/awwaawwa/BabelDOC-Assets/resolve/main/fonts/${name}?download=true`,
 
  
};

export const CN_FONT_FAMILY = {
    // 手写体
    "script": [
        "LXGWWenKaiGB-Regular.1.520.ttf",
    ],
    // 正文字体
    "normal": [
        "SourceHanSerifCN-Bold.ttf",
        "SourceHanSerifCN-Regular.ttf",
        "SourceHanSansCN-Bold.ttf",
        "SourceHanSansCN-Regular.ttf",
    ],
    // 备用字体
    "fallback": [
        "GoNotoKurrent-Regular.ttf",
        "GoNotoKurrent-Bold.ttf",
    ],
    "base": ["SourceHanSansCN-Regular.ttf"],
}

export const HK_FONT_FAMILY = {
    "script": ["LXGWWenKaiTC-Regular.1.520.ttf"],
    "normal": [
        "SourceHanSerifHK-Bold.ttf",
        "SourceHanSerifHK-Regular.ttf",
        "SourceHanSansHK-Bold.ttf",
        "SourceHanSansHK-Regular.ttf",
    ],
    "fallback": [
        "GoNotoKurrent-Regular.ttf",
        "GoNotoKurrent-Bold.ttf",
    ],
    "base": ["SourceHanSansCN-Regular.ttf"],
}

export const TW_FONT_FAMILY = {
    "script": ["LXGWWenKaiTC-Regular.1.520.ttf"],
    "normal": [
        "SourceHanSerifTW-Bold.ttf",
        "SourceHanSerifTW-Regular.ttf",
        "SourceHanSansTW-Bold.ttf",
        "SourceHanSansTW-Regular.ttf",
    ],
    "fallback": [
        "GoNotoKurrent-Regular.ttf",
        "GoNotoKurrent-Bold.ttf",
    ],
    "base": ["SourceHanSansCN-Regular.ttf"],
}

export const KR_FONT_FAMILY = {
    "script": ["MaruBuri-Regular.ttf"],
    "normal": [
        "SourceHanSerifKR-Bold.ttf",
        "SourceHanSerifKR-Regular.ttf",
        "SourceHanSansKR-Bold.ttf",
        "SourceHanSansKR-Regular.ttf",
    ],
    "fallback": [
        "GoNotoKurrent-Regular.ttf",
        "GoNotoKurrent-Bold.ttf",
    ],
    "base": ["SourceHanSansCN-Regular.ttf"],
}

export const JP_FONT_FAMILY = {
    "script": ["KleeOne-Regular.ttf"],
    "normal": [
        "SourceHanSerifJP-Bold.ttf",
        "SourceHanSerifJP-Regular.ttf",
        "SourceHanSansJP-Bold.ttf",
        "SourceHanSansJP-Regular.ttf",
    ],
    "fallback": [
        "GoNotoKurrent-Regular.ttf",
        "GoNotoKurrent-Bold.ttf",
    ],
    "base": ["SourceHanSansCN-Regular.ttf"],
}

export const EN_FONT_FAMILY = {
    "script": [
        "NotoSans-Italic.ttf",
        "NotoSans-BoldItalic.ttf",
        "NotoSerif-Italic.ttf",
        "NotoSerif-BoldItalic.ttf",
    ],
    "normal": [
        "NotoSerif-Regular.ttf",
        "NotoSerif-Bold.ttf",
        "NotoSans-Regular.ttf",
        "NotoSans-Bold.ttf",
    ],
    "fallback": [
        "GoNotoKurrent-Regular.ttf",
        "GoNotoKurrent-Bold.ttf",
    ],
    "base": [
        "NotoSans-Regular.ttf",
    ],
}

export interface FontMetadata {
  ascent: number;
  bold: number;
  descent: number;
  encoding_length: number;
  file_name: string;
  font_name: string;
  italic: number;
  monospace: number;
  serif: number;
  sha3_256: string;
  size: number;
}

export const EMBEDDING_FONT_METADATA: Record<string, FontMetadata> = {
"GoNotoKurrent-Bold.ttf": {
        "ascent": 1069,
        "bold": 1,
        "descent": -293,
        "encoding_length": 2,
        "file_name": "GoNotoKurrent-Bold.ttf",
        "font_name": "Go Noto Kurrent-Bold Bold",
        "italic": 0,
        "monospace": 0,
        "serif": 0,
        "sha3_256": "000b37f592477945b27b7702dcad39f73e23e140e66ddff9847eb34f32389566",
        "size": 15303772,
    },
    "GoNotoKurrent-Regular.ttf": {
        "ascent": 1069,
        "bold": 0,
        "descent": -293,
        "encoding_length": 2,
        "file_name": "GoNotoKurrent-Regular.ttf",
        "font_name": "Go Noto Kurrent-Regular Regular",
        "italic": 0,
        "monospace": 0,
        "serif": 0,
        "sha3_256": "4324a60d507c691e6efc97420647f4d2c2d86d9de35009d1c769861b76074ae6",
        "size": 15515760,
    },
    "KleeOne-Regular.ttf": {
        "ascent": 1160,
        "bold": 0,
        "descent": -288,
        "encoding_length": 2,
        "file_name": "KleeOne-Regular.ttf",
        "font_name": "Klee One Regular",
        "italic": 0,
        "monospace": 0,
        "serif": 0,
        "sha3_256": "8585c29f89b322d937f83739f61ede5d84297873e1465cad9a120a208ac55ce0",
        "size": 8724704,
    },
    "LXGWWenKaiGB-Regular.1.520.ttf": {
        "ascent": 928,
        "bold": 0,
        "descent": -256,
        "encoding_length": 2,
        "file_name": "LXGWWenKaiGB-Regular.1.520.ttf",
        "font_name": "LXGW WenKai GB Regular",
        "italic": 0,
        "monospace": 0,
        "serif": 0,
        "sha3_256": "0671656b00992e317f9e20610e7145b024e664ada9f272d4f8e497196af98005",
        "size": 24903712,
    },
    "LXGWWenKaiGB-Regular.ttf": {
        "ascent": 928,
        "bold": 0,
        "descent": -256,
        "encoding_length": 2,
        "file_name": "LXGWWenKaiGB-Regular.ttf",
        "font_name": "LXGW WenKai GB Regular",
        "italic": 0,
        "monospace": 0,
        "serif": 1,
        "sha3_256": "b563a5e8d9db4cd15602a3a3700b01925e80a21f99fb88e1b763b1fb8685f8ee",
        "size": 19558756,
    },
    "LXGWWenKaiMonoTC-Regular.ttf": {
        "ascent": 928,
        "bold": 0,
        "descent": -241,
        "encoding_length": 2,
        "file_name": "LXGWWenKaiMonoTC-Regular.ttf",
        "font_name": "LXGW WenKai Mono TC Regular",
        "italic": 0,
        "monospace": 1,
        "serif": 0,
        "sha3_256": "596b278d11418d374a1cfa3a50cbfb82b31db82d3650cfacae8f94311b27fdc5",
        "size": 13115416,
    },
    "LXGWWenKai-Regular.1.520.ttf": {
        "ascent": 928,
        "bold": 0,
        "descent": -256,
        "encoding_length": 2,
        "file_name": "LXGWWenKai-Regular.1.520.ttf",
        "font_name": "LXGW WenKai Regular",
        "italic": 0,
        "monospace": 0,
        "serif": 0,
        "sha3_256": "708b4fd6cfae62a26f71016724d38e862210732f101b9225225a1d5e8205f94d",
        "size": 24744500,
    },
    "LXGWWenKaiTC-Regular.1.520.ttf": {
        "ascent": 928,
        "bold": 0,
        "descent": -256,
        "encoding_length": 2,
        "file_name": "LXGWWenKaiTC-Regular.1.520.ttf",
        "font_name": "LXGW WenKai TC Regular",
        "italic": 0,
        "monospace": 0,
        "serif": 0,
        "sha3_256": "347d3d4bd88c2afcb194eba186d2c6c0b95d18b2145220feb1c88abf761f1398",
        "size": 15348376,
    },
    "LXGWWenKaiTC-Regular.ttf": {
        "ascent": 928,
        "bold": 0,
        "descent": -256,
        "encoding_length": 2,
        "file_name": "LXGWWenKaiTC-Regular.ttf",
        "font_name": "LXGW WenKai TC Regular",
        "italic": 0,
        "monospace": 0,
        "serif": 1,
        "sha3_256": "66ccd0ffe8e56cd585dabde8d1292c3f551b390d8ed85f81d7a844825f9c2379",
        "size": 13100328,
    },
    "MaruBuri-Regular.ttf": {
        "ascent": 800,
        "bold": 0,
        "descent": -200,
        "encoding_length": 2,
        "file_name": "MaruBuri-Regular.ttf",
        "font_name": "MaruBuri Regular",
        "italic": 0,
        "monospace": 0,
        "serif": 0,
        "sha3_256": "abb672dde7b89e06914ce27c59159b7a2933f26207bfcc47981c67c11c41e6d1",
        "size": 3268988,
    },
    "NotoSans-Bold.ttf": {
        "ascent": 1069,
        "bold": 1,
        "descent": -293,
        "encoding_length": 2,
        "file_name": "NotoSans-Bold.ttf",
        "font_name": "Noto Sans Bold",
        "italic": 0,
        "monospace": 0,
        "serif": 0,
        "sha3_256": "ecd38d472c1cad07d8a5dffd2b5a0f72edcd40fff2b4e68d770da8f2ef343a82",
        "size": 630964,
    },
    "NotoSans-BoldItalic.ttf": {
        "ascent": 1069,
        "bold": 1,
        "descent": -293,
        "encoding_length": 2,
        "file_name": "NotoSans-BoldItalic.ttf",
        "font_name": "Noto Sans Bold Italic",
        "italic": 1,
        "monospace": 0,
        "serif": 0,
        "sha3_256": "0b6c690a4a6b7d605b2ecbde00c7ac1a23e60feb17fa30d8b972d61ec3ff732b",
        "size": 644340,
    },
    "NotoSans-Italic.ttf": {
        "ascent": 1069,
        "bold": 0,
        "descent": -293,
        "encoding_length": 2,
        "file_name": "NotoSans-Italic.ttf",
        "font_name": "Noto Sans Italic",
        "italic": 1,
        "monospace": 0,
        "serif": 0,
        "sha3_256": "830652f61724c017e5a29a96225b484a2ccbd25f69a1b3f47e5f466a2dbed1ad",
        "size": 642344,
    },
    "NotoSans-Regular.ttf": {
        "ascent": 1069,
        "bold": 0,
        "descent": -293,
        "encoding_length": 2,
        "file_name": "NotoSans-Regular.ttf",
        "font_name": "Noto Sans Regular",
        "italic": 0,
        "monospace": 0,
        "serif": 0,
        "sha3_256": "7dfe2bbf97dc04c852d1223b220b63430e6ad03b0dbb28ebe6328a20a2d45eb8",
        "size": 629024,
    },
    "NotoSerif-Bold.ttf": {
        "ascent": 1069,
        "bold": 1,
        "descent": -293,
        "encoding_length": 2,
        "file_name": "NotoSerif-Bold.ttf",
        "font_name": "Noto Serif Bold",
        "italic": 0,
        "monospace": 0,
        "serif": 1,
        "sha3_256": "28d88d924285eadb9f9ce49f2d2b95473f89a307b226c5f6ebed87a654898312",
        "size": 506864,
    },
    "NotoSerif-BoldItalic.ttf": {
        "ascent": 1069,
        "bold": 1,
        "descent": -293,
        "encoding_length": 2,
        "file_name": "NotoSerif-BoldItalic.ttf",
        "font_name": "Noto Serif Bold Italic",
        "italic": 1,
        "monospace": 0,
        "serif": 1,
        "sha3_256": "b69ee56af6351b2fb4fbce623f8e1c1f9fb19170686a9e5db2cf260b8cf24ac7",
        "size": 535724,
    },
    "NotoSerif-Italic.ttf": {
        "ascent": 1069,
        "bold": 0,
        "descent": -293,
        "encoding_length": 2,
        "file_name": "NotoSerif-Italic.ttf",
        "font_name": "Noto Serif Italic",
        "italic": 1,
        "monospace": 0,
        "serif": 1,
        "sha3_256": "9b7773c24ab8a29e3c1c03efa4ab652d051e4c209134431953463aa946d62868",
        "size": 535340,
    },
    "NotoSerif-Regular.ttf": {
        "ascent": 1069,
        "bold": 0,
        "descent": -293,
        "encoding_length": 2,
        "file_name": "NotoSerif-Regular.ttf",
        "font_name": "Noto Serif Regular",
        "italic": 0,
        "monospace": 0,
        "serif": 1,
        "sha3_256": "c2bbe984e65bafd3bcd38b3cb1e1344f3b7b79d6beffc7a3d883b57f8358559d",
        "size": 504932,
    },
    "SourceHanSansCN-Bold.ttf": {
        "ascent": 1160,
        "bold": 1,
        "descent": -288,
        "encoding_length": 2,
        "file_name": "SourceHanSansCN-Bold.ttf",
        "font_name": "Source Han Sans CN Bold",
        "italic": 0,
        "monospace": 0,
        "serif": 0,
        "sha3_256": "82314c11016a04ef03e7afd00abe0ccc8df54b922dee79abf6424f3002a31825",
        "size": 10174460,
    },
    "SourceHanSansCN-Regular.ttf": {
        "ascent": 1160,
        "bold": 0,
        "descent": -288,
        "encoding_length": 2,
        "file_name": "SourceHanSansCN-Regular.ttf",
        "font_name": "Source Han Sans CN Regular",
        "italic": 0,
        "monospace": 0,
        "serif": 0,
        "sha3_256": "b45a80cf3650bfc62aa014e58243c6325e182c4b0c5819e41a583c699cce9a8f",
        "size": 10397552,
    },
    "SourceHanSansHK-Bold.ttf": {
        "ascent": 1160,
        "bold": 1,
        "descent": -288,
        "encoding_length": 2,
        "file_name": "SourceHanSansHK-Bold.ttf",
        "font_name": "Source Han Sans HK Bold",
        "italic": 0,
        "monospace": 0,
        "serif": 0,
        "sha3_256": "3eecd57457ba9a0fbad6c794f40e7ae704c4f825091aef2ac18902ffdde50608",
        "size": 6856692,
    },
    "SourceHanSansHK-Regular.ttf": {
        "ascent": 1160,
        "bold": 0,
        "descent": -288,
        "encoding_length": 2,
        "file_name": "SourceHanSansHK-Regular.ttf",
        "font_name": "Source Han Sans HK Regular",
        "italic": 0,
        "monospace": 0,
        "serif": 0,
        "sha3_256": "5fe4141f9164c03616323400b2936ee4c8265314492e2b822c3a6fbfb63ffe08",
        "size": 6999792,
    },
    "SourceHanSansJP-Bold.ttf": {
        "ascent": 1160,
        "bold": 1,
        "descent": -288,
        "encoding_length": 2,
        "file_name": "SourceHanSansJP-Bold.ttf",
        "font_name": "Source Han Sans JP Bold",
        "italic": 0,
        "monospace": 0,
        "serif": 0,
        "sha3_256": "fb05bd84d62e8064117ee357ab6a4481e1cde931e8e984c0553c8c4b09dc3938",
        "size": 5603068,
    },
    "SourceHanSansJP-Regular.ttf": {
        "ascent": 1160,
        "bold": 0,
        "descent": -288,
        "encoding_length": 2,
        "file_name": "SourceHanSansJP-Regular.ttf",
        "font_name": "Source Han Sans JP Regular",
        "italic": 0,
        "monospace": 0,
        "serif": 0,
        "sha3_256": "722cfbdcc0fd83fe07a3d1b10e9e64343c924a351d02cfe8dbb6ec4c6bc38230",
        "size": 5723960,
    },
    "SourceHanSansKR-Bold.ttf": {
        "ascent": 1160,
        "bold": 1,
        "descent": -288,
        "encoding_length": 2,
        "file_name": "SourceHanSansKR-Bold.ttf",
        "font_name": "Source Han Sans KR Bold",
        "italic": 0,
        "monospace": 0,
        "serif": 0,
        "sha3_256": "02959eb2c1eea0786a736aeb50b6e61f2ab873cd69c659389b7511f80f734838",
        "size": 5858892,
    },
    "SourceHanSansKR-Regular.ttf": {
        "ascent": 1160,
        "bold": 0,
        "descent": -288,
        "encoding_length": 2,
        "file_name": "SourceHanSansKR-Regular.ttf",
        "font_name": "Source Han Sans KR Regular",
        "italic": 0,
        "monospace": 0,
        "serif": 0,
        "sha3_256": "aba70109eff718e8f796f0185f8dca38026c1661b43c195883c84577e501adf2",
        "size": 5961704,
    },
    "SourceHanSansTW-Bold.ttf": {
        "ascent": 1160,
        "bold": 1,
        "descent": -288,
        "encoding_length": 2,
        "file_name": "SourceHanSansTW-Bold.ttf",
        "font_name": "Source Han Sans TW Bold",
        "italic": 0,
        "monospace": 0,
        "serif": 0,
        "sha3_256": "4a92730e644a1348e87bba7c77e9b462f257f381bd6abbeac5860d8f8306aee6",
        "size": 6883224,
    },
    "SourceHanSansTW-Regular.ttf": {
        "ascent": 1160,
        "bold": 0,
        "descent": -288,
        "encoding_length": 2,
        "file_name": "SourceHanSansTW-Regular.ttf",
        "font_name": "Source Han Sans TW Regular",
        "italic": 0,
        "monospace": 0,
        "serif": 0,
        "sha3_256": "6129b68ff4b0814624cac7edca61fbacf8f4d79db6f4c3cfc46b1c48ea2f81ac",
        "size": 7024812,
    },
    "SourceHanSerifCN-Bold.ttf": {
        "ascent": 1150,
        "bold": 1,
        "descent": -286,
        "encoding_length": 2,
        "file_name": "SourceHanSerifCN-Bold.ttf",
        "font_name": "Source Han Serif CN Bold",
        "italic": 0,
        "monospace": 0,
        "serif": 1,
        "sha3_256": "77816a54957616e140e25a36a41fc061ddb505a1107de4e6a65f561e5dcf8310",
        "size": 14134156,
    },
    "SourceHanSerifCN-Regular.ttf": {
        "ascent": 1150,
        "bold": 0,
        "descent": -286,
        "encoding_length": 2,
        "file_name": "SourceHanSerifCN-Regular.ttf",
        "font_name": "Source Han Serif CN Regular",
        "italic": 0,
        "monospace": 0,
        "serif": 1,
        "sha3_256": "c8bf74da2c3b7457c9d887465b42fb6f80d3d84f361cfe5b0673a317fb1f85ad",
        "size": 14047768,
    },
    "SourceHanSerifHK-Bold.ttf": {
        "ascent": 1150,
        "bold": 1,
        "descent": -286,
        "encoding_length": 2,
        "file_name": "SourceHanSerifHK-Bold.ttf",
        "font_name": "Source Han Serif HK Bold",
        "italic": 0,
        "monospace": 0,
        "serif": 1,
        "sha3_256": "0f81296f22846b622a26f7342433d6c5038af708a32fc4b892420c150227f4bb",
        "size": 9532580,
    },
    "SourceHanSerifHK-Regular.ttf": {
        "ascent": 1150,
        "bold": 0,
        "descent": -286,
        "encoding_length": 2,
        "file_name": "SourceHanSerifHK-Regular.ttf",
        "font_name": "Source Han Serif HK Regular",
        "italic": 0,
        "monospace": 0,
        "serif": 1,
        "sha3_256": "d5232ec3adf4fb8604bb4779091169ec9bd9d574b513e4a75752e614193afebe",
        "size": 9467292,
    },
    "SourceHanSerifJP-Bold.ttf": {
        "ascent": 1150,
        "bold": 1,
        "descent": -286,
        "encoding_length": 2,
        "file_name": "SourceHanSerifJP-Bold.ttf",
        "font_name": "Source Han Serif JP Bold",
        "italic": 0,
        "monospace": 0,
        "serif": 1,
        "sha3_256": "a4a8c22e8ec7bb6e66b9caaff1e12c7a52b5a4201eec3d074b35957c0126faef",
        "size": 7811832,
    },
    "SourceHanSerifJP-Regular.ttf": {
        "ascent": 1150,
        "bold": 0,
        "descent": -286,
        "encoding_length": 2,
        "file_name": "SourceHanSerifJP-Regular.ttf",
        "font_name": "Source Han Serif JP Regular",
        "italic": 0,
        "monospace": 0,
        "serif": 1,
        "sha3_256": "3d1f9933c7f3abc8c285e317119a533e6dcfe6027d1f5f066ba71b3eb9161e9c",
        "size": 7748816,
    },
    "SourceHanSerifKR-Bold.ttf": {
        "ascent": 1150,
        "bold": 1,
        "descent": -286,
        "encoding_length": 2,
        "file_name": "SourceHanSerifKR-Bold.ttf",
        "font_name": "Source Han Serif KR Bold",
        "italic": 0,
        "monospace": 0,
        "serif": 1,
        "sha3_256": "b071b1aecb042aa779e1198767048438dc756d0da8f90660408abb421393f5cb",
        "size": 12387920,
    },
    "SourceHanSerifKR-Regular.ttf": {
        "ascent": 1150,
        "bold": 0,
        "descent": -286,
        "encoding_length": 2,
        "file_name": "SourceHanSerifKR-Regular.ttf",
        "font_name": "Source Han Serif KR Regular",
        "italic": 0,
        "monospace": 0,
        "serif": 1,
        "sha3_256": "a85913439f0a49024ca77c02dfede4318e503ee6b2b7d8fef01eb42435f27b61",
        "size": 12459924,
    },
    "SourceHanSerifTW-Bold.ttf": {
        "ascent": 1150,
        "bold": 1,
        "descent": -286,
        "encoding_length": 2,
        "file_name": "SourceHanSerifTW-Bold.ttf",
        "font_name": "Source Han Serif TW Bold",
        "italic": 0,
        "monospace": 0,
        "serif": 1,
        "sha3_256": "562eea88895ab79ffefab7eabb4d322352a7b1963764c524c6d5242ca456bb6e",
        "size": 9551724,
    },
    "SourceHanSerifTW-Regular.ttf": {
        "ascent": 1150,
        "bold": 0,
        "descent": -286,
        "encoding_length": 2,
        "file_name": "SourceHanSerifTW-Regular.ttf",
        "font_name": "Source Han Serif TW Regular",
        "italic": 0,
        "monospace": 0,
        "serif": 1,
        "sha3_256": "85c1d6460b2e169b3d53ac60f6fb7a219fb99923027d78fb64b679475e2ddae4",
        "size": 9486772,
    },
};
export const CMAP_URL_BY_UPSTREAM: Record<string, (name: string) => string> = {
    "github": (name: string) => `https://raw.githubusercontent.com/funstory-ai/BabelDOC-Assets/refs/heads/main/cmap/${name}`,
    "huggingface": (name: string) => `https://huggingface.co/datasets/awwaawwa/BabelDOC-Assets/resolve/main/cmap/${name}?download=true`,
    "hf-mirror": (name: string) => `https://hf-mirror.com/datasets/awwaawwa/BabelDOC-Assets/resolve/main/cmap/${name}?download=true`,
    "modelscope": (name: string) => `https://www.modelscope.cn/datasets/awwaawwa/BabelDOCAssets/resolve/master/cmap/${name}`,
};

export interface CMapMetadata {
  file_name: string;
  sha3_256: string;
  size: number;
}

export const CMAP_METADATA: Record<string, CMapMetadata> = {
    "78-EUC-H.json": {
        "file_name": "78-EUC-H.json",
        "sha3_256": "657006ae4360ac584316dbda94f2223d7dd4cf7c721021b78b470ed712d22a3d",
        "size": 15035,
    },
    "78-EUC-V.json": {
        "file_name": "78-EUC-V.json",
        "sha3_256": "ffd0610937d3893cd6b9f10007033dab4c846d6a50914b3e0b5b1a1d5a446483",
        "size": 704,
    },
    "78-H.json": {
        "file_name": "78-H.json",
        "sha3_256": "07960a71bd7f2dc8501bfff6ebacb5d179961accbb8d043837d6d213d4e7c43f",
        "size": 14993,
    },
    "78-RKSJ-H.json": {
        "file_name": "78-RKSJ-H.json",
        "sha3_256": "2cea4cbf474c08d99420790509473f48960d14df27e37155c0833150eff0310c",
        "size": 15054,
    },
    "78-RKSJ-V.json": {
        "file_name": "78-RKSJ-V.json",
        "sha3_256": "0005485dc7cb41b9911d651a31a008ff4d8f707f3a271f5eb900640415255f58",
        "size": 705,
    },
    "78-V.json": {
        "file_name": "78-V.json",
        "sha3_256": "6ec527dfdd6f8176719db47aea208d96c8427ff2c44bb6d6adcf215e3599c7dd",
        "size": 700,
    },
    "78ms-RKSJ-H.json": {
        "file_name": "78ms-RKSJ-H.json",
        "sha3_256": "781802e72f8e79d599d58a81445333d005df5117b10c9b8392459729e51bbec7",
        "size": 17125,
    },
    "78ms-RKSJ-V.json": {
        "file_name": "78ms-RKSJ-V.json",
        "sha3_256": "1854ff118f30bdee044813bf764f44123697cb2c2dfcfacb10e1aa161d7db16b",
        "size": 1928,
    },
    "83pv-RKSJ-H.json": {
        "file_name": "83pv-RKSJ-H.json",
        "sha3_256": "2b6dd0a63fc97f3b33767a1b16a49b30ba0cb97a1ff01deb6ca5592d90e79815",
        "size": 5277,
    },
    "90ms-RKSJ-H.json": {
        "file_name": "90ms-RKSJ-H.json",
        "sha3_256": "ebacf23e35e924a65b45afb6276f645289f68b122f1b32ab4dbc64f9c7903ccf",
        "size": 4117,
    },
    "90ms-RKSJ-V.json": {
        "file_name": "90ms-RKSJ-V.json",
        "sha3_256": "0e08ffc0c46d93912870ad12a863081bcea12db09038e3929e1e015cfc1663da",
        "size": 1928,
    },
    "90msp-RKSJ-H.json": {
        "file_name": "90msp-RKSJ-H.json",
        "sha3_256": "3098d897f17b1723d5915518d281d3c5d4f46f0b83dbde8b8001073e0f882d32",
        "size": 4096,
    },
    "90msp-RKSJ-V.json": {
        "file_name": "90msp-RKSJ-V.json",
        "sha3_256": "a7ad430c32de4dbce2667fff874efc5d4114c685107f026788eee4ec83992fc8",
        "size": 1929,
    },
    "90pv-RKSJ-H.json": {
        "file_name": "90pv-RKSJ-H.json",
        "sha3_256": "2c1720cc7343f95ccb87e073df0c7788d33bc8811b703b709a0230e79ecb2341",
        "size": 6314,
    },
    "90pv-RKSJ-V.json": {
        "file_name": "90pv-RKSJ-V.json",
        "sha3_256": "487bf100397d4f0bcfa86dbfea149cac54faa59c0b449d65284cc43123d99023",
        "size": 1283,
    },
    "Add-H.json": {
        "file_name": "Add-H.json",
        "sha3_256": "3bd6fbbe961dffa3a6395d1e3823da665efc74363f44ff6083d98fc5ae22433a",
        "size": 15174,
    },
    "Add-RKSJ-H.json": {
        "file_name": "Add-RKSJ-H.json",
        "sha3_256": "bde048bae5dc9c43570bff29ff4691e03372e029dde66edc5e8de64a891dd53b",
        "size": 15259,
    },
    "Add-RKSJ-V.json": {
        "file_name": "Add-RKSJ-V.json",
        "sha3_256": "1a81852c30ebf3101e1e0b0b5eff2e4f19211373c513d7c42b0933ded6b6e59b",
        "size": 1426,
    },
    "Add-V.json": {
        "file_name": "Add-V.json",
        "sha3_256": "6a4f7a4ee2d7a04ce0500b93453859faf3fc3f11b3f55cb61753ef79846b419b",
        "size": 1421,
    },
    "B5-H.json": {
        "file_name": "B5-H.json",
        "sha3_256": "f1b984aa231df737628663a56d380c93fe3172a243792db6d36921b964a118db",
        "size": 5960,
    },
    "B5-V.json": {
        "file_name": "B5-V.json",
        "sha3_256": "0fafc3f78a34f2bf2377a89b2679469505a35ae42df95bf6765f743344f9a94c",
        "size": 334,
    },
    "B5pc-H.json": {
        "file_name": "B5pc-H.json",
        "sha3_256": "07f0c25086768b9731971ba164d88cb10202a9d36e79a076c43233351f61c52f",
        "size": 6015,
    },
    "B5pc-V.json": {
        "file_name": "B5pc-V.json",
        "sha3_256": "f5e44d8eeeda40e8c3a81858dfb823eeed3f5e834e985544d1e56fb79260b8f8",
        "size": 336,
    },
    "CNS-EUC-H.json": {
        "file_name": "CNS-EUC-H.json",
        "sha3_256": "2add6b8cd4750db8bf6b029595232fecb8f1e54a0bad56590d4aa46401085e44",
        "size": 11342,
    },
    "CNS-EUC-V.json": {
        "file_name": "CNS-EUC-V.json",
        "sha3_256": "1ff26a35f10467a99957886c482de267658b9132a704b547381c90fc37c90820",
        "size": 12592,
    },
    "CNS1-H.json": {
        "file_name": "CNS1-H.json",
        "sha3_256": "e64c524f07718603b6bd84fd6799f875cc13c00137fbaa2b41215d518e96c87a",
        "size": 3728,
    },
    "CNS1-V.json": {
        "file_name": "CNS1-V.json",
        "sha3_256": "57a1d2aabe6ab9db9a323ab43c37e3aa1ba9b3eb71841dfec4d8568d657d503a",
        "size": 332,
    },
    "CNS2-H.json": {
        "file_name": "CNS2-H.json",
        "sha3_256": "90831af5d65fae9565d705fc8f1fccd091e33a67a1e544552410e39d7558daed",
        "size": 2053,
    },
    "CNS2-V.json": {
        "file_name": "CNS2-V.json",
        "sha3_256": "c4d2aae661b26120030754901abced51766fa4bce638433a7aa7130a3d5eabb0",
        "size": 54,
    },
    "ETHK-B5-H.json": {
        "file_name": "ETHK-B5-H.json",
        "sha3_256": "3ef2e9ef0364675c2fb9ccbfd37ed9227d416457ee8cadb9e59b2db4354d88ea",
        "size": 25660,
    },
    "ETHK-B5-V.json": {
        "file_name": "ETHK-B5-V.json",
        "sha3_256": "a12c5917b6f3400793e7d6ea2e217e9af05a28621a937cfef4da9f5184a03578",
        "size": 364,
    },
    "ETen-B5-H.json": {
        "file_name": "ETen-B5-H.json",
        "sha3_256": "57f29290c730277b221ad074709d4f76c429d5410931131c9da7157ebae76951",
        "size": 6205,
    },
    "ETen-B5-V.json": {
        "file_name": "ETen-B5-V.json",
        "sha3_256": "d07d9af9e30a8fc3ca7e52158f854226b831ab9ef552cda46219819e47950680",
        "size": 364,
    },
    "ETenms-B5-H.json": {
        "file_name": "ETenms-B5-H.json",
        "sha3_256": "0659f282182ebdaa6abb38062bc3428a3b7b5907513fd499980d1b49930a9b9e",
        "size": 72,
    },
    "ETenms-B5-V.json": {
        "file_name": "ETenms-B5-V.json",
        "sha3_256": "74b107f8950456b2df294a089091837bf802892c1bc3136c403da2a427130c33",
        "size": 429,
    },
    "EUC-H.json": {
        "file_name": "EUC-H.json",
        "sha3_256": "b6df6e254254eb5a2254b0d581f4820d2b3553cd372136ec88f605521683c44a",
        "size": 2910,
    },
    "EUC-V.json": {
        "file_name": "EUC-V.json",
        "sha3_256": "e81c0f409365f2fd60232f6e5c84bf52c8a6b9c6336d4c96fb554f213dbdfaf6",
        "size": 701,
    },
    "Ext-H.json": {
        "file_name": "Ext-H.json",
        "sha3_256": "629359cf115575acb68b59c82373a1a3958001212a854d0a5b98e6fe1efe81db",
        "size": 15891,
    },
    "Ext-RKSJ-H.json": {
        "file_name": "Ext-RKSJ-H.json",
        "sha3_256": "3336a4a77a75924588f13c5a24157680c9c5b6a46298063dcdb461b90bb55da0",
        "size": 15975,
    },
    "Ext-RKSJ-V.json": {
        "file_name": "Ext-RKSJ-V.json",
        "sha3_256": "f2915039ff32992094ff6521fa24c3f41c27f55f3f071730eea732e261a2a553",
        "size": 994,
    },
    "Ext-V.json": {
        "file_name": "Ext-V.json",
        "sha3_256": "e2fb58ec483aee0910b0733dcb6220f10f9f4d2553c8c139a523e3992363f93e",
        "size": 989,
    },
    "GB-EUC-H.json": {
        "file_name": "GB-EUC-H.json",
        "sha3_256": "4a0b5fda367993409663ec1d4be57c207a3500d778373546b729d143d789c191",
        "size": 2178,
    },
    "GB-EUC-V.json": {
        "file_name": "GB-EUC-V.json",
        "sha3_256": "b45a8a562304c2c388fd1574c3a1a0af6f49e4849f7904ba07d57967d9625917",
        "size": 520,
    },
    "GB-H.json": {
        "file_name": "GB-H.json",
        "sha3_256": "a50b5d6461c95a667ccbc44c507ff5e6686e4f1bbd8bfae69486396b4ed03510",
        "size": 2139,
    },
    "GB-V.json": {
        "file_name": "GB-V.json",
        "sha3_256": "1f043042065f2df4590ebbd27fbc8f93802ea66caeb0b8ba92823575842743e5",
        "size": 516,
    },
    "GBK-EUC-H.json": {
        "file_name": "GBK-EUC-H.json",
        "sha3_256": "4502e7abe2edfb6256b5a4308dfca940aaa92a2d951c4b44942ce7bdb9eda877",
        "size": 99532,
    },
    "GBK-EUC-V.json": {
        "file_name": "GBK-EUC-V.json",
        "sha3_256": "c71f6281bb59897dcf48f587136d002d5caa8a0ed89f9b490a6a288765ec674d",
        "size": 521,
    },
    "GBK2K-H.json": {
        "file_name": "GBK2K-H.json",
        "sha3_256": "0a2a975da25641067ea2743f15407df20895b28804a1e64c12cd9fd0f306b1a9",
        "size": 109298,
    },
    "GBK2K-V.json": {
        "file_name": "GBK2K-V.json",
        "sha3_256": "0febb4a13f8f73dc949d159b4f37e886d1c3d1514aaf53d3492e0b5e21523f52",
        "size": 1044,
    },
    "GBKp-EUC-H.json": {
        "file_name": "GBKp-EUC-H.json",
        "sha3_256": "50d628304aff1f13ded3790cc3b8bd48502267768cac5e72cb3be8a46f9a5436",
        "size": 99510,
    },
    "GBKp-EUC-V.json": {
        "file_name": "GBKp-EUC-V.json",
        "sha3_256": "8c540fc12dfed309896544f8153fa52b793708a85e3882985567dcae86fb1732",
        "size": 522,
    },
    "GBT-EUC-H.json": {
        "file_name": "GBT-EUC-H.json",
        "sha3_256": "5fbe99ec7638de5216ea452788d3ef40cfd8c110c8b8ae936b57db6221d9b9d9",
        "size": 54802,
    },
    "GBT-EUC-V.json": {
        "file_name": "GBT-EUC-V.json",
        "sha3_256": "4cc3a48b1f7c8ab088391aa78131289da3d68e2fe0071b380a10c19757356ab5",
        "size": 521,
    },
    "GBT-H.json": {
        "file_name": "GBT-H.json",
        "sha3_256": "8bbbbbdee2722751708dd66a7ed12fa54a08bbf0dcfaefca2b87f305ca591f32",
        "size": 54763,
    },
    "GBT-V.json": {
        "file_name": "GBT-V.json",
        "sha3_256": "32e4457c8b0edbeeec9445465ec40106603ad50003e1af98994c02020df1c59f",
        "size": 517,
    },
    "GBTpc-EUC-H.json": {
        "file_name": "GBTpc-EUC-H.json",
        "sha3_256": "7f7faa903850fc471948e284853a81ee2f4a32693e14131f3ab1fbc490c5695b",
        "size": 54820,
    },
    "GBTpc-EUC-V.json": {
        "file_name": "GBTpc-EUC-V.json",
        "sha3_256": "3cf85a97171567e08d0112b71ca4a0aef68c52918b7c635669ef7e25e1bcb818",
        "size": 523,
    },
    "GBpc-EUC-H.json": {
        "file_name": "GBpc-EUC-H.json",
        "sha3_256": "38332ce5be0b82e4010fbd05ceac92e9f05a784ccacf6a4f004cd8da734c47de",
        "size": 2196,
    },
    "GBpc-EUC-V.json": {
        "file_name": "GBpc-EUC-V.json",
        "sha3_256": "5a0b4e7db0aedd6b27f84b191791b527da3ea27ea1ca42460086cb0d294418bf",
        "size": 522,
    },
    "H.json": {
        "file_name": "H.json",
        "sha3_256": "5ee11fcc99897b769fd62238967954e957bb8079353abba815792aab6f3e329c",
        "size": 2868,
    },
    "HKdla-B5-H.json": {
        "file_name": "HKdla-B5-H.json",
        "sha3_256": "8f24808486e1d5363a66981021f3f8b136f1ec6231d48bda76344e1f7f1695aa",
        "size": 25384,
    },
    "HKdla-B5-V.json": {
        "file_name": "HKdla-B5-V.json",
        "sha3_256": "1e686a7f69d6b7a3c05a4be9e7e396cf81498ef48299341616e76805c1092733",
        "size": 340,
    },
    "HKdlb-B5-H.json": {
        "file_name": "HKdlb-B5-H.json",
        "sha3_256": "0ccae437017107059630d56c7e0e2d6f086d5fb512c9e60b1bd48c4a04b6652d",
        "size": 22501,
    },
    "HKdlb-B5-V.json": {
        "file_name": "HKdlb-B5-V.json",
        "sha3_256": "dad584337fd6e5e6ab5e1e30dc9b8cc1013985a04a159b3c108c4dfb5c10fb55",
        "size": 340,
    },
    "HKgccs-B5-H.json": {
        "file_name": "HKgccs-B5-H.json",
        "sha3_256": "f7da0854c355c51957de6e71ffa33fbc69414d52dcfc5a5cb50c8f8c6c6bd9c6",
        "size": 13642,
    },
    "HKgccs-B5-V.json": {
        "file_name": "HKgccs-B5-V.json",
        "sha3_256": "d7f89dc24162b624bc4d68248da315a4d39eaf9a8f63c1392e06d2aa46f015a",
        "size": 341,
    },
    "HKm314-B5-H.json": {
        "file_name": "HKm314-B5-H.json",
        "sha3_256": "febd4cb78048e012478df9fc91aa23e946304d63c5f7c64ea8e16277b64a359b",
        "size": 13405,
    },
    "HKm314-B5-V.json": {
        "file_name": "HKm314-B5-V.json",
        "sha3_256": "d310bbf5a975fe8e1f8bb4523b0db8e792043578f0c2a12735bbc24fc4a3721f",
        "size": 341,
    },
    "HKm471-B5-H.json": {
        "file_name": "HKm471-B5-H.json",
        "sha3_256": "fdb1368b1a6f4df20ab87e2a1045a579088645828d1168e39d6aa5b52c09bd8e",
        "size": 17079,
    },
    "HKm471-B5-V.json": {
        "file_name": "HKm471-B5-V.json",
        "sha3_256": "34c40c1bb1409942f12f66f1bcbc2be73406b4c5e626ea7a4ab7f73160ba2a88",
        "size": 341,
    },
    "HKscs-B5-H.json": {
        "file_name": "HKscs-B5-H.json",
        "sha3_256": "63fe2b09c05c8ef70fb937aad49698d4154e1d7bb75f94344fea4db522b87a88",
        "size": 25722,
    },
    "HKscs-B5-V.json": {
        "file_name": "HKscs-B5-V.json",
        "sha3_256": "14c864025ffca616fc173458162efe190bdace4700e2a7ad4869c66476534223",
        "size": 365,
    },
    "Hankaku.json": {
        "file_name": "Hankaku.json",
        "sha3_256": "befe81a2bbe191bcb8e0ff23706a51cb6a41a60f6bc508d5c0c19040c14afc06",
        "size": 238,
    },
    "Hiragana.json": {
        "file_name": "Hiragana.json",
        "sha3_256": "0e8ce0a48ec8c05f4c65d23ada539c4a2a236fcb7dd46e20874acd9362394525",
        "size": 200,
    },
    "Identity-H.json": {
        "file_name": "Identity-H.json",
        "sha3_256": "77cc630138b29b5acd4ab216cb1d173bb3e7b994ab932a4f3d8a9121be91fbab",
        "size": 6404,
    },
    "Identity-V.json": {
        "file_name": "Identity-V.json",
        "sha3_256": "067a8d390f2d99dfa94ff19009925e5815c8b54b65b39314a244cbbace494679",
        "size": 62,
    },
    "KSC-EUC-H.json": {
        "file_name": "KSC-EUC-H.json",
        "sha3_256": "79fb3c0bd9d2ce6b80da98d6f1ef4fd2776dfc3fb78c5ee4d6ee3a06aebc9fd0",
        "size": 11234,
    },
    "KSC-EUC-V.json": {
        "file_name": "KSC-EUC-V.json",
        "sha3_256": "a541a285c966105a92dba6939401ac8aaeb057e5200bdbf8c874ceecb9f37b01",
        "size": 441,
    },
    "KSC-H.json": {
        "file_name": "KSC-H.json",
        "sha3_256": "a0a20bce98ffe98036aa748d46c2921e17247827a22298edb59c778b8b776f24",
        "size": 11214,
    },
    "KSC-Johab-H.json": {
        "file_name": "KSC-Johab-H.json",
        "sha3_256": "3d7cd1473ddcf7c3bfb80c7eadf45a365389759b1df1f53e0bd5f31e31125e96",
        "size": 100922,
    },
    "KSC-Johab-V.json": {
        "file_name": "KSC-Johab-V.json",
        "sha3_256": "2f7cf1d05bd82d65e488fc3297aefc1c1f48f2c6972b01304c4be5f260fae86e",
        "size": 443,
    },
    "KSC-V.json": {
        "file_name": "KSC-V.json",
        "sha3_256": "f6f09bab60f802d61c22368ca8650cefa08851c2039c5825e37404c7047eb496",
        "size": 437,
    },
    "KSCms-UHC-H.json": {
        "file_name": "KSCms-UHC-H.json",
        "sha3_256": "6df55fd679239f3a6642c7690e89a85525fa6a8a3cf748aef247b2d06fdc1aca",
        "size": 16419,
    },
    "KSCms-UHC-HW-H.json": {
        "file_name": "KSCms-UHC-HW-H.json",
        "sha3_256": "a05183c5d7b6b6f62d11f8175e5749d5ad2913d469403905c8f01a403d715583",
        "size": 16422,
    },
    "KSCms-UHC-HW-V.json": {
        "file_name": "KSCms-UHC-HW-V.json",
        "sha3_256": "e2586795b094fade7385ff1ce5570232edc791c456acf4c6e1c11bc501f82a4",
        "size": 446,
    },
    "KSCms-UHC-V.json": {
        "file_name": "KSCms-UHC-V.json",
        "sha3_256": "c09dc49c1afea5a5dc01bd6ac672d2af83b4821d74de7df71d4da3233513cefb",
        "size": 443,
    },
    "KSCpc-EUC-H.json": {
        "file_name": "KSCpc-EUC-H.json",
        "sha3_256": "b43448cb510c7f952a6affd0950db58063719f7499309c64f78fea6b2778fa11",
        "size": 12226,
    },
    "KSCpc-EUC-V.json": {
        "file_name": "KSCpc-EUC-V.json",
        "sha3_256": "1f4889c2e7278085738257e8097382ef5ac40b543b71751b75b155b056a46db2",
        "size": 443,
    },
    "Katakana.json": {
        "file_name": "Katakana.json",
        "sha3_256": "524b659bd0acc0fb4baa7633c3250683d6b3ba1685caadc9739240ccdbfd2ce2",
        "size": 86,
    },
    "NWP-H.json": {
        "file_name": "NWP-H.json",
        "sha3_256": "6c067655436fe89fb21a26e258973313bfe7cd5fbab3a2857b00ea92cc82c25d",
        "size": 18143,
    },
    "NWP-V.json": {
        "file_name": "NWP-V.json",
        "sha3_256": "b494038c72c63c6917ab3edf83a8b6bf21c65ba9ea47a4887833fffcc434763",
        "size": 1205,
    },
    "RKSJ-H.json": {
        "file_name": "RKSJ-H.json",
        "sha3_256": "eff868636f960b80d6923b77eb59d76acf6d7297bc74e1b7f3a13ff92a71c1cb",
        "size": 2953,
    },
    "RKSJ-V.json": {
        "file_name": "RKSJ-V.json",
        "sha3_256": "f3827bc17eb1172a5713d2d5c83a9b60f965894e3f2cb8dcb731b6f151abaa10",
        "size": 702,
    },
    "Roman.json": {
        "file_name": "Roman.json",
        "sha3_256": "620ab6ac0f4b487f19d44397b49612db57d164ddbff8e7d52fb5fd7e969e0cb9",
        "size": 67,
    },
    "UniAKR-UTF16-H.json": {
        "file_name": "UniAKR-UTF16-H.json",
        "sha3_256": "1204af593c62e5d10ace0db3b5ca0caecc80240f1c866bf1585fad405c204a54",
        "size": 232741,
    },
    "UniAKR-UTF32-H.json": {
        "file_name": "UniAKR-UTF32-H.json",
        "sha3_256": "cbbebc4b9b018109612dcfc0798f5c164d739a8b202017580301e0f27f76c35d",
        "size": 296773,
    },
    "UniAKR-UTF8-H.json": {
        "file_name": "UniAKR-UTF8-H.json",
        "sha3_256": "e08da06fc02a877abb02205fe0db3b61566d9ac41511a735ef2f12b5741d069a",
        "size": 266575,
    },
    "UniCNS-UCS2-H.json": {
        "file_name": "UniCNS-UCS2-H.json",
        "sha3_256": "48a0840498b90cf597c05ad2f63e26aaea778a49171f821d4b87b94424d7e640",
        "size": 400654,
    },
    "UniCNS-UCS2-V.json": {
        "file_name": "UniCNS-UCS2-V.json",
        "sha3_256": "014f9d86baea5fd13e460dd3735eab98dbbacf126922826ef0be9d7c8c605418",
        "size": 360,
    },
    "UniCNS-UTF16-H.json": {
        "file_name": "UniCNS-UTF16-H.json",
        "sha3_256": "c67980ebfb0d525365d0b5421548cc64ce9fb89afca1a0f6d04972f1e39b7f9c",
        "size": 320254,
    },
    "UniCNS-UTF16-V.json": {
        "file_name": "UniCNS-UTF16-V.json",
        "sha3_256": "98bd35d76997c0f3c443f130d44e814997cb0277183b7bf6571f92206d9a85a0",
        "size": 311,
    },
    "UniCNS-UTF32-H.json": {
        "file_name": "UniCNS-UTF32-H.json",
        "sha3_256": "6ab73cc531843f9bef915a949a0b79de1df288bb7ed6026db782ac446ed36c94",
        "size": 391690,
    },
    "UniCNS-UTF32-V.json": {
        "file_name": "UniCNS-UTF32-V.json",
        "sha3_256": "d94f8c3d7fe834d34f746b940a4bb5dd8479353e3b9f95b308642a8be793a44",
        "size": 391,
    },
    "UniCNS-UTF8-H.json": {
        "file_name": "UniCNS-UTF8-H.json",
        "sha3_256": "3666cbe4d00de4038120c98472137857c93d44735c3a5def8c4ac7f84a59aa72",
        "size": 357287,
    },
    "UniCNS-UTF8-V.json": {
        "file_name": "UniCNS-UTF8-V.json",
        "sha3_256": "e410ed491c0e2f31ba30cfd60eb4e21c40d3ee82e2be1c06c7adb8772b175f10",
        "size": 350,
    },
    "UniGB-UCS2-H.json": {
        "file_name": "UniGB-UCS2-H.json",
        "sha3_256": "42a8e01b690cf2cd6b137c1eb94e7668899f0041b6e43b921252fe453486a96e",
        "size": 336533,
    },
    "UniGB-UCS2-V.json": {
        "file_name": "UniGB-UCS2-V.json",
        "sha3_256": "0a0aaf21f823546faf0971b7926724cc95b53b3da3f42a22ec0526ca8de1b237",
        "size": 617,
    },
    "UniGB-UTF16-H.json": {
        "file_name": "UniGB-UTF16-H.json",
        "sha3_256": "c306f093839fffe81e0c8597a24be508a64aa2a9c3e9b9eee858d55059530c0d",
        "size": 251806,
    },
    "UniGB-UTF16-V.json": {
        "file_name": "UniGB-UTF16-V.json",
        "sha3_256": "bd283b8c7e145e340db39868ec1a3b0a08d89acc2bfac672d41008a8195c7bb3",
        "size": 456,
    },
    "UniGB-UTF32-H.json": {
        "file_name": "UniGB-UTF32-H.json",
        "sha3_256": "a01a6a8b4b715f27c7e1866894240b0e1fd61a4eaca1c91df80c1f256ad06f72",
        "size": 319766,
    },
    "UniGB-UTF32-V.json": {
        "file_name": "UniGB-UTF32-V.json",
        "sha3_256": "8b31bba8b852a2c6c1f6d92aea633285e2f75237fbe87ecadff9f9312a0bfaa9",
        "size": 572,
    },
    "UniGB-UTF8-H.json": {
        "file_name": "UniGB-UTF8-H.json",
        "sha3_256": "87f7a6b0360d0f9bd0658cb7a67587e86c604be44292214622d972d85a474dbf",
        "size": 290481,
    },
    "UniGB-UTF8-V.json": {
        "file_name": "UniGB-UTF8-V.json",
        "sha3_256": "1378adf3ecd0bfbdb11dabbf2118cbb968a03aa2215780b77b07459e3b1df6e7",
        "size": 513,
    },
    "UniJIS-UCS2-H.json": {
        "file_name": "UniJIS-UCS2-H.json",
        "sha3_256": "a73e449136b46240ef86c9fb2b614e7d290b814130e9beb4b987c52fd7eda575",
        "size": 205924,
    },
    "UniJIS-UCS2-HW-H.json": {
        "file_name": "UniJIS-UCS2-HW-H.json",
        "sha3_256": "e58ec4fd06677ecfcef12d25f6456b7f80da706b2ac6ef915239e0b780b775a0",
        "size": 154,
    },
    "UniJIS-UCS2-HW-V.json": {
        "file_name": "UniJIS-UCS2-HW-V.json",
        "sha3_256": "bc3c81dbd6329d83cd71743a6985ed0cf516b0aa97a1c58c3cc3940e280b1e8e",
        "size": 4868,
    },
    "UniJIS-UCS2-V.json": {
        "file_name": "UniJIS-UCS2-V.json",
        "sha3_256": "276712ac66416538e859ad28e9f5b685fbc71e5d7d91e905a3489f03667ae4bc",
        "size": 4775,
    },
    "UniJIS-UTF16-H.json": {
        "file_name": "UniJIS-UTF16-H.json",
        "sha3_256": "afc923e268f22dcf09e0871ce0060c7588aa1304d4b26e781a261c14566f7642",
        "size": 238042,
    },
    "UniJIS-UTF16-V.json": {
        "file_name": "UniJIS-UTF16-V.json",
        "sha3_256": "0a044ab7015485c3b0f7f9e4d883a1d9e9f1d04235b13e2a17687e878ce3e9f0",
        "size": 3951,
    },
    "UniJIS-UTF32-H.json": {
        "file_name": "UniJIS-UTF32-H.json",
        "sha3_256": "1c27e2e595d659073e37e5ee22a9b39abe30af1483de33e1078ed174abdc723c",
        "size": 295294,
    },
    "UniJIS-UTF32-V.json": {
        "file_name": "UniJIS-UTF32-V.json",
        "sha3_256": "aa7a475ce5f85f79d73e17355c08e6aee21a949b596f2efe359913489a22117f",
        "size": 4983,
    },
    "UniJIS-UTF8-H.json": {
        "file_name": "UniJIS-UTF8-H.json",
        "sha3_256": "d91079b3f1671a7f4ace8b8f89478558f43f7782e666064ce1b53af563a87306",
        "size": 266367,
    },
    "UniJIS-UTF8-V.json": {
        "file_name": "UniJIS-UTF8-V.json",
        "sha3_256": "d0c8c94f7d54dafa40876ce7eb28845d8ac00b688cf4bac255694cb2f086d109",
        "size": 4483,
    },
    "UniJIS2004-UTF16-H.json": {
        "file_name": "UniJIS2004-UTF16-H.json",
        "sha3_256": "336660e87fc57ad166258d22f09690fcebb546840faee1e1b3f6cad3556bcf80",
        "size": 238119,
    },
    "UniJIS2004-UTF16-V.json": {
        "file_name": "UniJIS2004-UTF16-V.json",
        "sha3_256": "f6619a74b62f9986e9a74620b28e726b927dde5cd6184742f368ef4d686fe55c",
        "size": 3955,
    },
    "UniJIS2004-UTF32-H.json": {
        "file_name": "UniJIS2004-UTF32-H.json",
        "sha3_256": "2512690db880e0663f8208d22acda8daa98f1240ff14e038bf02e57c4908afb5",
        "size": 295371,
    },
    "UniJIS2004-UTF32-V.json": {
        "file_name": "UniJIS2004-UTF32-V.json",
        "sha3_256": "da1728a91845f1654457eaf0f15b75d1ace5cbf75486bca8523bd5edf20a8010",
        "size": 4987,
    },
    "UniJIS2004-UTF8-H.json": {
        "file_name": "UniJIS2004-UTF8-H.json",
        "sha3_256": "af36b0255a1ed15966670703ba8a48987a1cf7e43f5c94a4e86a41e5ee26b940",
        "size": 266444,
    },
    "UniJIS2004-UTF8-V.json": {
        "file_name": "UniJIS2004-UTF8-V.json",
        "sha3_256": "28bebdf1581c45f2e9b38caa2ff643abd561321bab45febb0f90d802d2290faa",
        "size": 4487,
    },
    "UniJISPro-UCS2-HW-V.json": {
        "file_name": "UniJISPro-UCS2-HW-V.json",
        "sha3_256": "21fd353a062b6c415389d6fde11718488f765ca31fd4ca481050c89633568009",
        "size": 4994,
    },
    "UniJISPro-UCS2-V.json": {
        "file_name": "UniJISPro-UCS2-V.json",
        "sha3_256": "8daa155869a35f3f629abb042790c59eb5cff342b83573c2ae4c87b3e865dc27",
        "size": 4901,
    },
    "UniJISPro-UTF8-V.json": {
        "file_name": "UniJISPro-UTF8-V.json",
        "sha3_256": "19b9a6d908f9fb7413d778c9cc912072314864225c38a3f5c345936fabcea650",
        "size": 5726,
    },
    "UniJISX0213-UTF32-H.json": {
        "file_name": "UniJISX0213-UTF32-H.json",
        "sha3_256": "e6a07453703f5070bf567c9d67aa20bc4b404bd311413fed45d9ba8c297a91d9",
        "size": 295246,
    },
    "UniJISX0213-UTF32-V.json": {
        "file_name": "UniJISX0213-UTF32-V.json",
        "sha3_256": "5f2dd4ff8045b2308a707e3d4ffb73e1ba7f5a1c1fdb43b17c5a322109897b9c",
        "size": 4908,
    },
    "UniJISX02132004-UTF32-H.json": {
        "file_name": "UniJISX02132004-UTF32-H.json",
        "sha3_256": "81427dc73cf9392c0c3e8eeeb1dedbc797b123059714bfcdcd1ecffec9f34e3",
        "size": 295323,
    },
    "UniJISX02132004-UTF32-V.json": {
        "file_name": "UniJISX02132004-UTF32-V.json",
        "sha3_256": "c0721298f3449f0c6f48ada1200ebcadbfc4020b10333871f6c0eea0be9f13ac",
        "size": 4912,
    },
    "UniKS-UCS2-H.json": {
        "file_name": "UniKS-UCS2-H.json",
        "sha3_256": "3a1c10535982d06dde447764f8e3dd82c6c87bec6c4272eaf449f67db6d50ab8",
        "size": 202706,
    },
    "UniKS-UCS2-V.json": {
        "file_name": "UniKS-UCS2-V.json",
        "sha3_256": "b915820ff4639f837e4d3b7e5a7c0810c26af1dcf3df9e56ed9a0a69e3cdba9d",
        "size": 492,
    },
    "UniKS-UTF16-H.json": {
        "file_name": "UniKS-UTF16-H.json",
        "sha3_256": "820f534efffcef15f0d3f270c078774febee31b451a1387b27f7225da321c12f",
        "size": 153894,
    },
    "UniKS-UTF16-V.json": {
        "file_name": "UniKS-UTF16-V.json",
        "sha3_256": "2b5be7641990cf79754a12309c6069c01b636cfc3308bc4dc8075da59c2d8d6b",
        "size": 403,
    },
    "UniKS-UTF32-H.json": {
        "file_name": "UniKS-UTF32-H.json",
        "sha3_256": "541515ed8ff15170b38fbe6587ff6c54f6fc75aeede9da110133dc335e4ddf0e",
        "size": 195998,
    },
    "UniKS-UTF32-V.json": {
        "file_name": "UniKS-UTF32-V.json",
        "sha3_256": "940e977d3927c8480c65dc4ad6be4f365f65b8d76707758a7696d40e2b3583ea",
        "size": 503,
    },
    "UniKS-UTF8-H.json": {
        "file_name": "UniKS-UTF8-H.json",
        "sha3_256": "81b5c336c1a20dee2e9592c6615a46cdd906edd242717c1807609b5687576252",
        "size": 177154,
    },
    "UniKS-UTF8-V.json": {
        "file_name": "UniKS-UTF8-V.json",
        "sha3_256": "9a282e8eee884f801a5518cc52ff240ee8635553661dd0ee7df952adbad7462a",
        "size": 452,
    },
    "V.json": {
        "file_name": "V.json",
        "sha3_256": "616f263e53079846a66efc861524a15c0a411e823c37fe08e62bad835745cbba",
        "size": 697,
    },
    "WP-Symbol.json": {
        "file_name": "WP-Symbol.json",
        "sha3_256": "533dfe497eab1f095039b6344217fc0ff6b1f7cdf9b406bb19c30b945fe78c21",
        "size": 588,
    },
};

export function getFontFamily(langCode: string) {
  const families: Record<string, any> = {
    CN: CN_FONT_FAMILY,
    TW: TW_FONT_FAMILY,
    HK: HK_FONT_FAMILY,
    KR: KR_FONT_FAMILY,
    JP: JP_FONT_FAMILY,
    EN: EN_FONT_FAMILY
  };

  return families[langCode] || EN_FONT_FAMILY;
}