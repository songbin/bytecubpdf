from babeldoc.const import get_cache_file_path
import os
def get_rapidocr_config():
    """返回RapidOCR的标准配置"""
    file_path = get_cache_file_path("test", "models")
    parent_dir = os.path.dirname(file_path)
    config = {
        'Global': {
            'text_score': 0.5,
            'use_det': True,
            'use_cls': True,
            'use_rec': True,
            'print_verbose': False,
            'min_height': 30,
            'width_height_ratio': 8,
            'max_side_len': 2000,
            'min_side_len': 30,
            'return_word_box': False,
            'intra_op_num_threads': -1,
            'inter_op_num_threads': -1
        },
        'Det': {
            'intra_op_num_threads': -1,
            'inter_op_num_threads': -1,
            'use_cuda': False,
            'use_dml': False,
            'model_path': os.path.join(parent_dir, 'ch_PP-OCRv4_det_infer.onnx'),
            #'model_path': 'models/ch_PP-OCRv4_det_infer.onnx',
            'limit_side_len': 736,
            'limit_type': 'min',
            'std': [0.5, 0.5, 0.5],
            'mean': [0.5, 0.5, 0.5],
            'thresh': 0.3,
            'box_thresh': 0.5,
            'max_candidates': 1000,
            'unclip_ratio': 1.6,
            'use_dilation': True,
            'score_mode': 'fast'
        },
        'Cls': {
            'intra_op_num_threads': -1,
            'inter_op_num_threads': -1,
            'use_cuda': False,
            'use_dml': False,
            'model_path': os.path.join(parent_dir, 'ch_ppocr_mobile_v2.0_cls_infer.onnx'),
            #'model_path': 'models/ch_ppocr_mobile_v2.0_cls_infer.onnx',
            'cls_image_shape': [3, 48, 192],
            'cls_batch_num': 6,
            'cls_thresh': 0.9,
            'label_list': ['0', '180']
        },
        'Rec': {
            'intra_op_num_threads': -1,
            'inter_op_num_threads': -1,
            'use_cuda': False,
            'use_dml': False,
            'model_path': os.path.join(parent_dir, 'ch_PP-OCRv4_rec_infer.onnx'),
            #'model_path': 'models/ch_PP-OCRv4_rec_infer.onnx',
            'rec_img_shape': [3, 48, 320],
            'rec_batch_num': 6
        }
    }
    return config