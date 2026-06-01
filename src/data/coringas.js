// CIDs "coringa" — diagnósticos frequentes no PS/UTI organizados por categoria
export const CORINGAS_GRUPOS = [
  {
    id: 'infeccioso',
    label: 'Infeccioso',
    cor: 'red',
    cids: [
      { co_cid: 'A419', no_cid: 'Septicemia não especificada',              label: 'Sepse'          },
      { co_cid: 'J189', no_cid: 'Pneumonia não especificada',               label: 'Pneumonia'      },
      { co_cid: 'N390', no_cid: 'Infecção do trato urinário',               label: 'ITU/Pielonefrite'},
      { co_cid: 'A90',  no_cid: 'Dengue',                                   label: 'Dengue'         },
      { co_cid: 'L031', no_cid: 'Celulite de outras partes do membro',      label: 'Celulite'       },
    ],
  },
  {
    id: 'cardiovascular',
    label: 'Cardiovascular',
    cor: 'orange',
    cids: [
      { co_cid: 'I219', no_cid: 'Infarto agudo do miocárdio não especificado', label: 'IAM'         },
      { co_cid: 'I500', no_cid: 'Insuficiência cardíaca congestiva',            label: 'ICC'         },
      { co_cid: 'I269', no_cid: 'Embolia pulmonar sem cor pulmonale agudo',     label: 'TEP'         },
      { co_cid: 'I489', no_cid: 'Fibrilação atrial não especificada',           label: 'FA'          },
      { co_cid: 'I472', no_cid: 'Taquicardia ventricular',                      label: 'TV'          },
    ],
  },
  {
    id: 'respiratorio',
    label: 'Respiratório',
    cor: 'blue',
    cids: [
      { co_cid: 'J960', no_cid: 'Insuficiência respiratória aguda',             label: 'IRpA'        },
      { co_cid: 'J441', no_cid: 'DPOC com exacerbação aguda',                   label: 'DPOC'        },
      { co_cid: 'J939', no_cid: 'Pneumotórax não especificado',                 label: 'Pneumotórax' },
    ],
  },
  {
    id: 'neurologico',
    label: 'Neurológico / Trauma',
    cor: 'purple',
    cids: [
      { co_cid: 'I639', no_cid: 'Infarto cerebral não especificado',            label: 'AVC isquêmico'},
      { co_cid: 'S062', no_cid: 'Traumatismo cerebral difuso',                  label: 'TCE'          },
      { co_cid: 'G419', no_cid: 'Epilepsia não especificada',                   label: 'Epilepsia'    },
      { co_cid: 'S129', no_cid: 'Fratura do pescoço não especificada',          label: 'Trauma raquimedular'},
    ],
  },
  {
    id: 'abdominal',
    label: 'Abdominal / GI',
    cor: 'yellow',
    cids: [
      { co_cid: 'K920', no_cid: 'Hematêmese',                                  label: 'HDA'          },
      { co_cid: 'K359', no_cid: 'Apendicite aguda sem outra especificação',     label: 'Apendicite'   },
      { co_cid: 'K859', no_cid: 'Pancreatite aguda não especificada',           label: 'Pancreatite'  },
      { co_cid: 'K566', no_cid: 'Outras obstruções intestinais e as NE',        label: 'Obstr. intest.'},
    ],
  },
  {
    id: 'renal',
    label: 'Renal / Metabólico',
    cor: 'teal',
    cids: [
      { co_cid: 'N179', no_cid: 'Insuficiência renal aguda não especificada',   label: 'IRA'          },
      { co_cid: 'E149', no_cid: 'Diabetes mellitus não especificado',           label: 'DM descomp.'  },
      { co_cid: 'E1110', no_cid: 'Cetoacidose diabética sem coma',              label: 'CAD'          },
    ],
  },
]

// Mantém compatibilidade com código que usa CORINGAS_CID
export const CORINGAS_CID = CORINGAS_GRUPOS.flatMap(g => g.cids)
